import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';

const API = '/api/resumes';

export interface ResumeEntry {
  id: string;
  fileName: string;
  uploadedAt: string;
}

interface ResumeSummaryDto {
  id: string;
  fileName: string;
  contentType: string;
  createdAt: string;
}

export type AddResumeResult = { success: true } | { success: false; error: string };

@Injectable({ providedIn: 'root' })
export class ResumesService {
  private readonly items = signal<ResumeEntry[]>([]);
  readonly list = this.items.asReadonly();

  constructor(private http: HttpClient) {}

  reloadFromApi(): void {
    this.http.get<ResumeSummaryDto[]>(API).subscribe({
      next: (rows) => this.items.set(rows.map(toResumeEntry)),
      error: () => this.items.set([]),
    });
  }

  add(file: File): Observable<AddResumeResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ResumeSummaryDto>(API, formData).pipe(
      tap((row) => {
        const entry = toResumeEntry(row);
        this.items.update((current) => [entry, ...current.filter((x) => x.id !== entry.id)]);
      }),
      map(() => ({ success: true as const })),
      catchError((err) => of({ success: false as const, error: uploadErrorMessage(err) })),
    );
  }

  replace(id: string, file: File): Observable<AddResumeResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.put<ResumeSummaryDto>(`${API}/${id}`, formData).pipe(
      tap((row) => {
        const entry = toResumeEntry(row);
        this.items.update((current) => current.map((e) => (e.id === id ? entry : e)));
      }),
      map(() => ({ success: true as const })),
      catchError((err) =>
        of({
          success: false as const,
          error: err?.error?.message || err?.error?.error || `Erro ao atualizar (${err?.status ?? 'rede'}).`,
        }),
      ),
    );
  }

  download(id: string): void {
    this.http.get(`${API}/${id}`, { responseType: 'blob', observe: 'response' }).subscribe({
      next: (res) => {
        const blob = res.body;
        if (!blob) return;
        const cd = res.headers.get('Content-Disposition');
        const m = cd?.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)/i);
        const name = m?.[1] ? decodeURIComponent(m[1]) : 'curriculo';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }

  hasDownload(_id: string): boolean {
    return true;
  }

  remove(id: string): void {
    this.http.delete<void>(`${API}/${id}`).subscribe({
      next: () => this.items.update((current) => current.filter((e) => e.id !== id)),
      error: () => this.reloadFromApi(),
    });
  }
}

function toResumeEntry(row: ResumeSummaryDto): ResumeEntry {
  return {
    id: row.id,
    fileName: row.fileName,
    uploadedAt: row.createdAt,
  };
}

function uploadErrorMessage(err: {
  error?: { message?: string; error?: string };
  status?: number;
}): string {
  return (
    err?.error?.message ||
    err?.error?.error ||
    (err?.status === 413
      ? 'Ficheiro demasiado grande (máx. 10 MB).'
      : `Não foi possível enviar (${err?.status ?? 'rede'}).`)
  );
}
