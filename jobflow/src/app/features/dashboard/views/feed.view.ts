import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobBoardService, CodanteJob, JobListResponse } from '../../../core/services/job-board.service';
import { SavedJobsService } from '../../../core/services/saved-jobs.service';

@Component({
  selector: 'app-feed-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feed.view.html',
  styleUrls: ['./feed.view.scss'],
})
export class FeedViewComponent implements OnInit {
  private readonly jobBoard = inject(JobBoardService);
  private readonly router = inject(Router);
  private readonly savedJobs = inject(SavedJobsService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly response = signal<JobListResponse | null>(null);
  readonly searchTerm = signal('');
  readonly currentPage = signal(1);

  readonly jobs = computed(() => this.response()?.data ?? []);
  readonly meta = computed(() => this.response()?.meta ?? null);

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
        }
      });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadJobs();
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
    const added = this.savedJobs.addJob(job);
    if (added) {
      this.showSaveFeedback();
    }
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
