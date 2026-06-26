import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

const AI_API = '/api/ai';

export interface AiStatus {
  disponivel: boolean;
  modelo: string;
  baseUrl: string;
  mensagem: string;
}

export interface AiJobAnalysis {
  pontuacao: number;
  resumo: string;
  skillsFaltantes: string[];
  planoEstudo: string[];
  bulletsCoverLetter: string[];
  recomendacao: string;
}

export interface AiResumeAnalysis {
  skillsDetectadas: string[];
  nivelEstimado: string;
  sugestoesAperfeicoamento: string[];
  resumoPerfil: string;
}

export type AiResumeResult =
  | { success: true; data: AiResumeAnalysis }
  | { success: false; error: string };

export type AiJobResult =
  | { success: true; data: AiJobAnalysis }
  | { success: false; error: string };

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly _status = signal<AiStatus | null>(null);
  readonly status = this._status.asReadonly();

  constructor(private http: HttpClient) {}

  checkStatus(): void {
    this.http.get<AiStatus>(`${AI_API}/status`).subscribe({
      next: (s) => this._status.set(s),
      error: () => this._status.set(null),
    });
  }

  extractSkillsFromResume(resumeId: string): Observable<AiResumeResult> {
    return this.http
      .post<AiResumeAnalysis>(`${AI_API}/resumes/${resumeId}/extract-skills`, {})
      .pipe(
        map((data) => ({ success: true as const, data })),
        catchError((err) =>
          of({
            success: false as const,
            error:
              err?.error?.error ??
              `Erro ao analisar currículo (${err?.status ?? 'rede'}).`,
          }),
        ),
      );
  }

  analyzeJobFit(jobId: string): Observable<AiJobResult> {
    return this.http
      .post<AiJobAnalysis>(`${AI_API}/jobs/${jobId}/analyze`, {})
      .pipe(
        map((data) => ({ success: true as const, data })),
        catchError((err) =>
          of({
            success: false as const,
            error:
              err?.error?.error ??
              `Erro ao analisar vaga (${err?.status ?? 'rede'}).`,
          }),
        ),
      );
  }
}
