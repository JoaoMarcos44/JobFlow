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

export interface AiInterviewCoachResponse {
  perguntasTecnicas: string[];
  perguntasComportamentais: string[];
  respostasModelo: { pergunta: string; sugestaoResposta: string }[];
  dicasPreparacao: string[];
  pontosFortes: string[];
  resumoVaga: string;
}

export interface AiCoverLetterResponse {
  cartaCompleta: string;
  assunto: string;
  pontosDestaque: string[];
  tomSugerido: string;
  dicaPersonalizacao: string;
}

export type AiResumeResult =
  | { success: true; data: AiResumeAnalysis }
  | { success: false; error: string };

export type AiJobResult =
  | { success: true; data: AiJobAnalysis }
  | { success: false; error: string };

export type AiInterviewCoachResult =
  | { success: true; data: AiInterviewCoachResponse }
  | { success: false; error: string };

export type AiCoverLetterResult =
  | { success: true; data: AiCoverLetterResponse }
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

  getInterviewPreparation(jobId: string): Observable<AiInterviewCoachResult> {
    return this.http
      .post<AiInterviewCoachResponse>(`${AI_API}/jobs/${jobId}/interview-coach`, {})
      .pipe(
        map((data) => ({ success: true as const, data })),
        catchError((err) =>
          of({
            success: false as const,
            error:
              err?.error?.error ??
              `Erro ao gerar preparação para entrevista (${err?.status ?? 'rede'}).`,
          }),
        ),
      );
  }

  generateCoverLetter(jobId: string): Observable<AiCoverLetterResult> {
    return this.http
      .post<AiCoverLetterResponse>(`${AI_API}/jobs/${jobId}/cover-letter`, {})
      .pipe(
        map((data) => ({ success: true as const, data })),
        catchError((err) =>
          of({
            success: false as const,
            error:
              err?.error?.error ??
              `Erro ao gerar carta de apresentação (${err?.status ?? 'rede'}).`,
          }),
        ),
      );
  }
}
