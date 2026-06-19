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
import { mountDashboardView, viewRoot } from '../dashboard-view-host';
import { animateElementsFrom } from '../dashboard.animations';
import {
  type ScheduleCategory,
  type WorkModeFilter,
  FEED_SKILL_OPTIONS,
  filterJobs,
} from './feed-filters';
import { companyInitial, scheduleLabel, shortenText, tagsFromJob } from './feed-job-display';

@Component({
  selector: 'app-feed-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feed.view.html',
  styleUrls: ['./feed.view.scss'],
})
export class FeedViewComponent implements OnInit, OnDestroy {
  private readonly jobBoardService = inject(JobBoardService);
  private readonly router = inject(Router);
  private readonly savedJobsService = inject(SavedJobsService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private entranceAnimation?: ReturnType<typeof mountDashboardView>;

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly response = signal<JobListResponse | null>(null);
  readonly searchTerm = signal('');
  readonly currentPage = signal(1);
  readonly scheduleCategory = signal<ScheduleCategory>('all');
  readonly workModeFilter = signal<WorkModeFilter>('all');
  readonly selectedSkillIds = signal<string[]>([]);
  readonly skillsPanelOpen = signal(false);
  readonly saveFeedbackVisible = signal(false);

  readonly skillFilterOptions = FEED_SKILL_OPTIONS;
  readonly jobs = computed(() => this.response()?.data ?? []);
  readonly meta = computed(() => this.response()?.meta ?? null);
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

  constructor() {
    afterNextRender(() => {
      requestAnimationFrame(() => {
        this.entranceAnimation = mountDashboardView(viewRoot(this.host.nativeElement, '.feed'));
      });
    });
  }

  ngOnInit(): void {
    this.loadJobs();
  }

  ngOnDestroy(): void {
    this.entranceAnimation?.revert();
  }

  loadJobs(): void {
    this.loading.set(true);
    this.error.set(false);
    this.jobBoardService
      .getJobs({ search: this.searchTerm() || undefined, page: this.currentPage() })
      .subscribe((jobListResponse) => {
        this.loading.set(false);
        if (jobListResponse == null) {
          this.error.set(true);
          this.response.set(null);
        } else {
          this.response.set(jobListResponse);
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
    const current = this.selectedSkillIds();
    if (current.includes(skillId)) {
      this.selectedSkillIds.set(current.filter((id) => id !== skillId));
    } else {
      this.selectedSkillIds.set([...current, skillId]);
    }
    queueMicrotask(() => this.animateJobCards());
  }

  isSkillFilterSelected(skillId: string): boolean {
    return this.selectedSkillIds().includes(skillId);
  }

  toggleSkillsPanel(): void {
    this.skillsPanelOpen.update((open) => !open);
  }

  clearFilters(): void {
    this.scheduleCategory.set('all');
    this.workModeFilter.set('all');
    this.selectedSkillIds.set([]);
    queueMicrotask(() => this.animateJobCards());
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

  saveJob(event: Event, job: CodanteJob): void {
    event.stopPropagation();
    event.preventDefault();
    this.savedJobsService.addJob(job).subscribe((savedSuccessfully) => {
      if (savedSuccessfully) this.flashSaveFeedback();
    });
  }

  isSaved(job: CodanteJob): boolean {
    return this.savedJobsService.isSaved(job.id);
  }

  readonly companyInitial = companyInitial;
  readonly tagsFromJob = tagsFromJob;
  readonly summary = shortenText;
  readonly scheduleLabel = scheduleLabel;

  private flashSaveFeedback(): void {
    this.saveFeedbackVisible.set(true);
    setTimeout(() => this.saveFeedbackVisible.set(false), 2500);
  }

  private animateJobCards(): void {
    animateElementsFrom(viewRoot(this.host.nativeElement, '.feed'), '.cards .card', {
      y: 20,
      opacity: 0,
      duration: 0.36,
      stagger: 0.05,
      ease: 'power3.out',
    });
  }
}
