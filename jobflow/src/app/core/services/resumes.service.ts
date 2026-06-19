import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { readApiErrorMessage } from '../http/api-error';

const RESUMES_API = '/api/resumes';

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
    this.http.get<ResumeSummaryDto[]>(RESUMES_API).subscribe({
      next: (summaries) => this.items.set(summaries.map(toResumeEntry)),
      error: () => this.items.set([]),
    });
  }

  add(file: File): Observable<AddResumeResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ResumeSummaryDto>(RESUMES_API, formData).pipe(
      tap((summary) => {
        const entry = toResumeEntry(summary);
        this.items.update((current) => [entry, ...current.filter((item) => item.id !== entry.id)]);
      }),
      map(() => ({ success: true as const })),
      catchError((error) =>
        of({
          success: false as const,
          error: readApiErrorMessage(
            error,
            error?.status === 413
              ? 'Ficheiro demasiado grande (máx. 10 MB).'
              : `Não foi possível enviar (${error?.status ?? 'rede'}).`,
          ),
        }),
      ),
    );
  }

  replace(id: string, file: File): Observable<AddResumeResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.put<ResumeSummaryDto>(`${RESUMES_API}/${id}`, formData).pipe(
      tap((summary) => {
        const entry = toResumeEntry(summary);
        this.items.update((current) => current.map((item) => (item.id === id ? entry : item)));
      }),
      map(() => ({ success: true as const })),
      catchError((error) =>
        of({
          success: false as const,
          error: readApiErrorMessage(error, `Erro ao atualizar (${error?.status ?? 'rede'}).`),
        }),
      ),
    );
  }

  download(id: string): void {
    this.http.get(`${RESUMES_API}/${id}`, { responseType: 'blob', observe: 'response' }).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) return;
        const contentDisposition = response.headers.get('Content-Disposition');
        const match = contentDisposition?.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)/i);
        const fileName = match?.[1] ? decodeURIComponent(match[1]) : 'curriculo';
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = fileName;
        anchor.click();
        URL.revokeObjectURL(objectUrl);
      },
    });
  }

  hasDownload(_id: string): boolean {
    return true;
  }

  remove(id: string): void {
    this.http.delete<void>(`${RESUMES_API}/${id}`).subscribe({
      next: () => this.items.update((current) => current.filter((item) => item.id !== id)),
      error: () => this.reloadFromApi(),
    });
  }
}

function toResumeEntry(summary: ResumeSummaryDto): ResumeEntry {
  return {
    id: summary.id,
    fileName: summary.fileName,
    uploadedAt: summary.createdAt,
  };
}
