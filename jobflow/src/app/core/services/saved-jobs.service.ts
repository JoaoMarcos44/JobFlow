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

function normalizeStatus(statusFromApi: string): KanbanStatus {
  if (statusFromApi === 'applied' || statusFromApi === 'offer') return statusFromApi;
  if (statusFromApi === 'archived') return 'offer';
  return 'saved';
}

function toSavedJobItem(dto: SavedJobResponseDto): SavedJobItem {
  return {
    id: dto.id,
    job: {
      id: dto.job.id,
      title: dto.job.title,
      company: dto.job.company,
      codanteId: dto.job.codanteId ?? null,
    },
    savedAt: dto.savedAt,
    status: normalizeStatus(dto.status),
    matchScore: dto.matchScore,
  };
}

@Injectable({ providedIn: 'root' })
export class SavedJobsService {
  private readonly items = signal<SavedJobItem[]>([]);
  readonly savedJobs = this.items.asReadonly();

  readonly savedCodanteIds = computed(() => {
    const ids = new Set<number>();
    for (const item of this.items()) {
      const codanteId = item.job.codanteId;
      if (codanteId != null) ids.add(codanteId);
    }
    return ids;
  });

  constructor(private http: HttpClient) {}

  reloadFromApi(): void {
    const params = new HttpParams().set('page', '0').set('size', '100');
    this.http.get<SpringPageDto>(API_BASE, { params }).subscribe({
      next: (page) => {
        const list = (page.content ?? []).map(toSavedJobItem);
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
      tap((dto) => {
        const item = toSavedJobItem(dto);
        this.items.update((current) => [
          ...current.filter((existing) => existing.id !== item.id),
          item,
        ]);
      }),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  updateStatus(savedJobId: string, status: KanbanStatus): void {
    this.http
      .put<SavedJobResponseDto>(`${API_BASE}/${savedJobId}`, { status })
      .pipe(
        tap((dto) => {
          this.items.update((current) =>
            current.map((item) =>
              item.id === savedJobId
                ? {
                    ...item,
                    status: normalizeStatus(dto.status),
                    matchScore: dto.matchScore,
                  }
                : item,
            ),
          );
        }),
      )
      .subscribe({ error: () => this.reloadFromApi() });
  }

  removeJob(savedJobId: string): void {
    this.http.delete<void>(`${API_BASE}/${savedJobId}`).subscribe({
      next: () => this.items.update((current) => current.filter((item) => item.id !== savedJobId)),
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
