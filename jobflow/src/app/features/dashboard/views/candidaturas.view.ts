import {
  Component,
  computed,
  inject,
  signal,
  ElementRef,
  afterNextRender,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SavedJobsService, KanbanStatus, type SavedJobItem } from '../../../core/services/saved-jobs.service';
import { AiService, AiJobAnalysis } from '../../../core/services/ai.service';
import { mountDashboardView, viewRoot } from '../dashboard-view-host';

export interface KanbanCard {
  id: string;
  jobId: string;
  title: string;
  company: string;
  status: KanbanStatus;
  matchScore?: number;
}

@Component({
  selector: 'app-candidaturas-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './candidaturas.view.html',
  styleUrls: ['./candidaturas.view.scss'],
})
export class CandidaturasViewComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly savedJobsService = inject(SavedJobsService);
  private readonly aiService = inject(AiService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private entranceAnimation?: ReturnType<typeof mountDashboardView>;

  readonly dragOverStatus = signal<KanbanStatus | null>(null);
  readonly analyzingJobId = signal<string | null>(null);
  readonly aiJobResult = signal<AiJobAnalysis | null>(null);
  readonly aiJobResultForId = signal<string | null>(null);
  readonly aiJobError = signal<string | null>(null);

  readonly saved = computed<KanbanCard[]>(() =>
    this.savedJobsService.savedJobs().filter((item) => item.status === 'saved').map(toKanbanCard),
  );
  readonly applied = computed<KanbanCard[]>(() =>
    this.savedJobsService.savedJobs().filter((item) => item.status === 'applied').map(toKanbanCard),
  );
  readonly offer = computed<KanbanCard[]>(() =>
    this.savedJobsService.savedJobs().filter((item) => item.status === 'offer').map(toKanbanCard),
  );

  constructor() {
    afterNextRender(() => {
      requestAnimationFrame(() => {
        const root = viewRoot(this.host.nativeElement, '.candidaturas-view');
        this.entranceAnimation = mountDashboardView(root, {
          selector: '.kanban-column',
          vars: { y: 24, opacity: 0, duration: 0.45, stagger: 0.09, ease: 'power3.out' },
        });
      });
    });
  }

  ngOnDestroy(): void {
    this.entranceAnimation?.revert();
  }

  onDragStart(event: DragEvent, card: KanbanCard): void {
    if (!event.dataTransfer) return;
    event.dataTransfer.setData('application/json', JSON.stringify({ id: card.id, status: card.status }));
    event.dataTransfer.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent, newStatus: KanbanStatus): void {
    event.preventDefault();
    this.dragOverStatus.set(newStatus);
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  onDragLeave(): void {
    this.dragOverStatus.set(null);
  }

  onDrop(event: DragEvent, newStatus: KanbanStatus): void {
    this.dragOverStatus.set(null);
    event.preventDefault();
    try {
      const dragPayloadJson = event.dataTransfer?.getData('application/json');
      if (!dragPayloadJson) return;
      const { id } = JSON.parse(dragPayloadJson) as { id: string };
      this.savedJobsService.updateStatus(id, newStatus);
    } catch {
      // ignore
    }
  }

  cancelCard(event: Event, card: KanbanCard): void {
    event.stopPropagation();
    event.preventDefault();
    this.savedJobsService.removeJob(card.id);
  }

  goToFeed(): void {
    this.router.navigate(['dashboard', 'feed']);
  }

  analyzeJob(card: KanbanCard): void {
    this.analyzingJobId.set(card.id);
    this.aiJobResult.set(null);
    this.aiJobResultForId.set(null);
    this.aiJobError.set(null);
    this.aiService.analyzeJobFit(card.jobId).subscribe((result) => {
      this.analyzingJobId.set(null);
      if (result.success) {
        this.aiJobResult.set(result.data);
        this.aiJobResultForId.set(card.id);
      } else {
        this.aiJobError.set(result.error);
      }
    });
  }

  closeAiJobResult(): void {
    this.aiJobResult.set(null);
    this.aiJobResultForId.set(null);
    this.aiJobError.set(null);
  }
}

function toKanbanCard(item: SavedJobItem): KanbanCard {
  return {
    id: item.id,
    jobId: item.job.id,
    title: item.job.title,
    company: item.job.company,
    status: item.status,
    matchScore: item.matchScore ?? undefined,
  };
}
