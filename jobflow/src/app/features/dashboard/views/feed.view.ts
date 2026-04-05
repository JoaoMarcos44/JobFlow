import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
  ElementRef,
  afterNextRender,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobBoardService, CodanteJob, JobListResponse } from '../../../core/services/job-board.service';
import { SavedJobsService } from '../../../core/services/saved-jobs.service';
import { animateElementsFrom, createDashboardViewStagger } from '../dashboard.animations';
import {
  type ScheduleCategory,
  type WorkModeFilter,
  FEED_SKILL_OPTIONS,
  filterJobs,
} from './feed-filters';

@Component({
  selector: 'app-feed-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feed.view.html',
  styleUrls: ['./feed.view.scss'],
})
export class FeedViewComponent implements OnInit, OnDestroy {
  private readonly jobBoard = inject(JobBoardService);
  private readonly router = inject(Router);
  private readonly savedJobs = inject(SavedJobsService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private viewCtx?: ReturnType<typeof createDashboardViewStagger>;

  private get feedRoot(): HTMLElement {
    return (this.host.nativeElement.querySelector('.feed') as HTMLElement) ?? this.host.nativeElement;
  }

  constructor() {
    afterNextRender(() => {
      requestAnimationFrame(() => {
        this.viewCtx = createDashboardViewStagger(this.feedRoot);
      });
    });
  }

  ngOnDestroy(): void {
    this.viewCtx?.revert();
  }

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly response = signal<JobListResponse | null>(null);
  readonly searchTerm = signal('');
  readonly currentPage = signal(1);
  readonly scheduleCategory = signal<ScheduleCategory>('all');
  readonly workModeFilter = signal<WorkModeFilter>('all');
  /** IDs de FEED_SKILL_OPTIONS — a vaga tem de mencionar todas (requisitos/descrição/título). */
  readonly selectedSkillIds = signal<string[]>([]);

  /** Painel de chips de habilidades (por defeito só Vínculo + Modo). */
  readonly skillsPanelOpen = signal(false);

  readonly skillFilterOptions = FEED_SKILL_OPTIONS;

  readonly jobs = computed(() => this.response()?.data ?? []);
  readonly meta = computed(() => this.response()?.meta ?? null);

  /** Filtros aplicados à lista da página atual (a API só expõe search/page). */
  readonly filteredJobs = computed(() =>
    filterJobs(
      this.jobs(),
      this.scheduleCategory(),
      this.workModeFilter(),
      this.selectedSkillIds(),
    ),
  );

  readonly hasActiveFilters = computed(
    () =>
      this.scheduleCategory() !== 'all' ||
      this.workModeFilter() !== 'all' ||
      this.selectedSkillIds().length > 0,
  );

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.loading.set(true);
    this.error.set(false);
    this.jobBoard
      .getJobs({ search: this.searchTerm() || undefined, page: this.currentPage() })
      .subscribe((res) => {
        this.loading.set(false);
        if (res == null) {
          this.error.set(true);
          this.response.set(null);
        } else {
          this.response.set(res);
          queueMicrotask(() => this.animateJobCards());
        }
      });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadJobs();
  }

  setScheduleCategory(value: ScheduleCategory): void {
    this.scheduleCategory.set(value);
    queueMicrotask(() => this.animateJobCards());
  }

  setWorkModeFilter(value: WorkModeFilter): void {
    this.workModeFilter.set(value);
    queueMicrotask(() => this.animateJobCards());
  }

  toggleSkillFilter(skillId: string): void {
    const cur = this.selectedSkillIds();
    if (cur.includes(skillId)) {
      this.selectedSkillIds.set(cur.filter((id) => id !== skillId));
    } else {
      this.selectedSkillIds.set([...cur, skillId]);
    }
    queueMicrotask(() => this.animateJobCards());
  }

  isSkillFilterSelected(skillId: string): boolean {
    return this.selectedSkillIds().includes(skillId);
  }

  toggleSkillsPanel(): void {
    this.skillsPanelOpen.update((v) => !v);
  }

  clearFilters(): void {
    this.scheduleCategory.set('all');
    this.workModeFilter.set('all');
    this.selectedSkillIds.set([]);
    queueMicrotask(() => this.animateJobCards());
  }

  private animateJobCards(): void {
    animateElementsFrom(this.feedRoot, '.cards .card', {
      y: 20,
      opacity: 0,
      duration: 0.36,
      stagger: 0.05,
      ease: 'power3.out',
    });
  }

  goToPage(page: number): void {
    const meta = this.meta();
    if (!meta || page < 1 || page > meta.last_page) return;
    this.currentPage.set(page);
    this.loadJobs();
  }

  openJob(job: CodanteJob): void {
    this.router.navigate(['dashboard', 'candidaturas'], { state: { job } });
  }

  companyInitial(company: string): string {
    return (company?.trim().charAt(0) || '?').toUpperCase();
  }

  /** Extrai até 4 "tags" a partir de requirements/description (ex.: tecnologias). */
  tagsFromJob(job: CodanteJob): string[] {
    const text = (job.requirements || job.description || '').replace(/\n/g, ' ');
    const words = text.split(/[\s,;()-]+/).filter((w) => w.length > 2 && /^[A-Za-z#]+$/.test(w));
    const seen = new Set<string>();
    const out: string[] = [];
    for (const w of words) {
      const key = w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      if (seen.has(key) || out.length >= 4) break;
      seen.add(key);
      out.push(key);
    }
    return out.slice(0, 4);
  }

  saveJob(event: Event, job: CodanteJob): void {
    event.stopPropagation();
    event.preventDefault();
    this.savedJobs.addJob(job).subscribe((ok) => {
      if (ok) this.showSaveFeedback();
    });
  }

  isSaved(job: CodanteJob): boolean {
    return this.savedJobs.isSaved(job.id);
  }

  private saveFeedbackVisible = signal(false);
  readonly showSaveFeedback = (): void => {
    this.saveFeedbackVisible.set(true);
    setTimeout(() => this.saveFeedbackVisible.set(false), 2500);
  };
  readonly saveFeedbackVisibleReadonly = this.saveFeedbackVisible.asReadonly();

  summary(description: string, maxLen: number = 120): string {
    if (!description) return '';
    const text = description.trim();
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen).trim() + '…';
  }

  scheduleLabel(schedule: string): string {
    const map: Record<string, string> = {
      'full-time': 'Tempo integral',
      'part-time': 'Meio período',
      contract: 'Contrato',
      internship: 'Estágio',
    };
    return map[schedule] ?? schedule;
  }
}
