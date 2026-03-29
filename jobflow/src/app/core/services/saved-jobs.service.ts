import { Injectable, signal, computed } from '@angular/core';
import { CodanteJob } from './job-board.service';

const STORAGE_KEY = 'jobflow_saved_jobs';

export type KanbanStatus = 'saved' | 'applied' | 'offer';

export interface SavedJobItem {
  id: string;
  job: CodanteJob;
  savedAt: string;
  status: KanbanStatus;
}

@Injectable({ providedIn: 'root' })
export class SavedJobsService {
  private readonly items = signal<SavedJobItem[]>(this.loadFromStorage());

  readonly savedJobs = this.items.asReadonly();

  private loadFromStorage(): SavedJobItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as (SavedJobItem & { status?: KanbanStatus })[];
      if (!Array.isArray(parsed)) return [];
      return parsed.map((i) => ({ ...i, status: i.status ?? 'saved' }));
    } catch {
      return [];
    }
  }

  private persist(list: SavedJobItem[]): void {
    this.items.set(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore quota errors
    }
  }

  addJob(job: CodanteJob): boolean {
    const id = `codante-${job.id}`;
    const list = this.items();
    if (list.some((i) => i.id === id)) return false;
    const newItem: SavedJobItem = {
      id,
      job: { ...job },
      savedAt: new Date().toISOString(),
      status: 'saved',
    };
    this.persist([...list, newItem]);
    return true;
  }

  updateStatus(id: string, status: KanbanStatus): void {
    const list = this.items().map((i) => (i.id === id ? { ...i, status } : i));
    this.persist(list);
  }

  removeJob(id: string): void {
    this.persist(this.items().filter((i) => i.id !== id));
  }

  isSaved(jobId: number): boolean {
    return this.items().some((i) => i.id === `codante-${jobId}`);
  }

  getSavedJobs(): SavedJobItem[] {
    return [...this.items()];
  }
}
