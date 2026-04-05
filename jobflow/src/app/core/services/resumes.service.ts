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
      next: (rows) => {
        this.items.set(
          rows.map((r) => ({
            id: r.id,
            fileName: r.fileName,
            uploadedAt: r.createdAt,
          })),
        );
      },
      error: () => this.items.set([]),
    });
  }

  add(file: File): Observable<AddResumeResult> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<ResumeSummaryDto>(API, fd).pipe(
      tap((r) => {
        const entry: ResumeEntry = {
          id: r.id,
          fileName: r.fileName,
          uploadedAt: r.createdAt,
        };
        this.items.update((cur) => [entry, ...cur.filter((x) => x.id !== entry.id)]);
      }),
      map(() => ({ success: true as const })),
      catchError((err) => {
        const msg =
          err?.error?.message ||
          err?.error?.error ||
          (err?.status === 413
            ? 'Ficheiro demasiado grande (máx. 10 MB).'
            : `Não foi possível enviar (${err?.status ?? 'rede'}).`);
        return of({ success: false as const, error: String(msg) });
      }),
    );
  }

  /** Atualiza (substitui) o ficheiro — completa o U do CRUD. */
  replace(id: string, file: File): Observable<AddResumeResult> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.put<ResumeSummaryDto>(`${API}/${id}`, fd).pipe(
      tap((r) => {
        const entry: ResumeEntry = {
          id: r.id,
          fileName: r.fileName,
          uploadedAt: r.createdAt,
        };
        this.items.update((cur) => cur.map((e) => (e.id === id ? entry : e)));
      }),
      map(() => ({ success: true as const })),
      catchError((err) => {
        const msg = err?.error?.message || err?.error?.error || `Erro ao atualizar (${err?.status ?? 'rede'}).`;
        return of({ success: false as const, error: String(msg) });
      }),
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
      next: () => this.items.update((cur) => cur.filter((e) => e.id !== id)),
      error: () => this.reloadFromApi(),
    });
  }
}
