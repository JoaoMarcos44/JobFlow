import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import type { CodanteJob } from './job-board.service';

const API_BASE = '/api/saved-jobs';

export type KanbanStatus = 'saved' | 'applied' | 'offer';

export interface SavedJobItem {
  id: string;
  job: {
    id: string;
    title: string;
    company: string;
    codanteId: number | null;
  };
  savedAt: string;
  status: KanbanStatus;
  matchScore?: number | null;
}

interface JobResponseDto {
  id: string;
  title: string;
  company: string;
  codanteId: number | null;
}

interface SavedJobResponseDto {
  id: string;
  job: JobResponseDto;
  notes: string | null;
  matchScore: number | null;
  status: string;
  savedAt: string;
  updatedAt: string;
}

interface SpringPageDto {
  content: SavedJobResponseDto[];
}

function normalizeStatus(s: string): KanbanStatus {
  if (s === 'applied' || s === 'offer') return s;
  if (s === 'archived') return 'offer';
  return 'saved';
}

@Injectable({ providedIn: 'root' })
export class SavedJobsService {
  private readonly items = signal<SavedJobItem[]>([]);
  readonly savedJobs = this.items.asReadonly();

  readonly savedCodanteIds = computed(() => {
    const ids = new Set<number>();
    for (const i of this.items()) {
      const c = i.job.codanteId;
      if (c != null) ids.add(c);
    }
    return ids;
  });

  constructor(private http: HttpClient) {}

  reloadFromApi(): void {
    const params = new HttpParams().set('page', '0').set('size', '100');
    this.http.get<SpringPageDto>(API_BASE, { params }).subscribe({
      next: (page) => {
        const list = (page.content ?? []).map((row): SavedJobItem => ({
          id: row.id,
          job: {
            id: row.job.id,
            title: row.job.title,
            company: row.job.company,
            codanteId: row.job.codanteId ?? null,
          },
          savedAt: row.savedAt,
          status: normalizeStatus(row.status),
          matchScore: row.matchScore,
        }));
        this.items.set(list);
      },
      error: () => this.items.set([]),
    });
  }

  addJob(job: CodanteJob): Observable<boolean> {
    const body = {
      codanteJob: {
        id: job.id,
        title: job.title,
        company: job.company,
        companyWebsite: job.company_website,
        city: job.city,
        schedule: job.schedule,
        salary: job.salary,
        description: job.description,
        requirements: job.requirements,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
      },
    };
    return this.http.post<SavedJobResponseDto>(`${API_BASE}/from-codante`, body).pipe(
      tap((row) => {
        const item: SavedJobItem = {
          id: row.id,
          job: {
            id: row.job.id,
            title: row.job.title,
            company: row.job.company,
            codanteId: row.job.codanteId ?? null,
          },
          savedAt: row.savedAt,
          status: normalizeStatus(row.status),
          matchScore: row.matchScore,
        };
        this.items.update((cur) => [...cur.filter((x) => x.id !== item.id), item]);
      }),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  updateStatus(savedJobId: string, status: KanbanStatus): void {
    this.http
      .put<SavedJobResponseDto>(`${API_BASE}/${savedJobId}`, { status })
      .pipe(
        tap((row) => {
          this.items.update((cur) =>
            cur.map((x) =>
              x.id === savedJobId
                ? {
                    ...x,
                    status: normalizeStatus(row.status),
                    matchScore: row.matchScore,
                  }
                : x,
            ),
          );
        }),
      )
      .subscribe({ error: () => this.reloadFromApi() });
  }

  removeJob(savedJobId: string): void {
    this.http.delete<void>(`${API_BASE}/${savedJobId}`).subscribe({
      next: () => this.items.update((cur) => cur.filter((x) => x.id !== savedJobId)),
      error: () => this.reloadFromApi(),
    });
  }

  isSaved(codanteJobId: number): boolean {
    return this.savedCodanteIds().has(codanteJobId);
  }

  getSavedJobs(): SavedJobItem[] {
    return [...this.items()];
  }
}
