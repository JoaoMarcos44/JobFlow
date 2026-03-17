import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SavedJobsService, KanbanStatus } from '../../../core/services/saved-jobs.service';

export interface KanbanCard {
  id: string;
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
export class CandidaturasViewComponent {
  private readonly router = inject(Router);
  private readonly savedJobs = inject(SavedJobsService);

  readonly saved = computed<KanbanCard[]>(() =>
    this.savedJobs.savedJobs().filter((i) => i.status === 'saved').map(this.toCard)
  );
  readonly applied = computed<KanbanCard[]>(() =>
    this.savedJobs.savedJobs().filter((i) => i.status === 'applied').map(this.toCard)
  );
  readonly offer = computed<KanbanCard[]>(() =>
    this.savedJobs.savedJobs().filter((i) => i.status === 'offer').map(this.toCard)
  );

  private toCard(item: { id: string; job: { title: string; company: string }; status: KanbanStatus }): KanbanCard {
    return {
      id: item.id,
      title: item.job.title,
      company: item.job.company,
      status: item.status,
    };
  }

  onDragStart(event: DragEvent, card: KanbanCard): void {
    if (!event.dataTransfer) return;
    event.dataTransfer.setData('application/json', JSON.stringify({ id: card.id, status: card.status }));
    event.dataTransfer.effectAllowed = 'move';
  }

  dragOverStatus = signal<KanbanStatus | null>(null);

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
      const raw = event.dataTransfer?.getData('application/json');
      if (!raw) return;
      const { id } = JSON.parse(raw) as { id: string };
      this.savedJobs.updateStatus(id, newStatus);
    } catch {
      // ignore
    }
  }

  cancelCard(event: Event, card: KanbanCard): void {
    event.stopPropagation();
    event.preventDefault();
    this.savedJobs.removeJob(card.id);
  }

  goToFeed(): void {
    this.router.navigate(['dashboard', 'feed']);
  }
}
