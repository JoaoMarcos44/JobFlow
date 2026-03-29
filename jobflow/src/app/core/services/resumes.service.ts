import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'jobflow_resumes';
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB (localStorage limit ~5MB)

export interface ResumeEntry {
  id: string;
  fileName: string;
  uploadedAt: string;
  /** Base64 content for download; optional if storage failed (e.g. file too big) */
  contentBase64?: string;
  mimeType?: string;
}

@Injectable({ providedIn: 'root' })
export class ResumesService {
  private readonly items = signal<ResumeEntry[]>(this.loadFromStorage());

  readonly list = this.items.asReadonly();

  private loadFromStorage(): ResumeEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ResumeEntry[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  add(file: File): Promise<{ entry: ResumeEntry; error?: string }> {
    return new Promise((resolve) => {
      if (file.size > MAX_FILE_SIZE) {
        resolve({
          entry: this.addMetadataOnly(file.name),
          error: 'Ficheiro demasiado grande (máx. 4 MB). Guardado apenas o nome.',
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const [header, base64] = dataUrl.split(',');
        const mime = header?.match(/data:([^;]+)/)?.[1] ?? 'application/octet-stream';
        const entry: ResumeEntry = {
          id: `resume-${Date.now()}`,
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
          contentBase64: base64 ?? '',
          mimeType: mime,
        };
        const list = [...this.items(), entry];
        this.items.set(list);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch {
          // quota – remove content and save metadata only
          const fallback: ResumeEntry = { ...entry, contentBase64: undefined, mimeType: undefined };
          const list2 = [...this.items().slice(0, -1), fallback];
          this.items.set(list2);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list2));
        }
        resolve({ entry });
      };
      reader.onerror = () =>
        resolve({ entry: this.addMetadataOnly(file.name), error: 'Não foi possível ler o ficheiro.' });
      reader.readAsDataURL(file);
    });
  }

  private addMetadataOnly(fileName: string): ResumeEntry {
    const entry: ResumeEntry = {
      id: `resume-${Date.now()}`,
      fileName,
      uploadedAt: new Date().toISOString(),
    };
    const list = [...this.items(), entry];
    this.items.set(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
    return entry;
  }

  /** Triggers download if content is stored; returns true if download started. */
  download(id: string): boolean {
    const entry = this.items().find((e) => e.id === id);
    if (!entry?.contentBase64) return false;
    try {
      const binary = atob(entry.contentBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: entry.mimeType ?? 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = entry.fileName;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch {
      return false;
    }
  }

  hasDownload(id: string): boolean {
    return !!this.items().find((e) => e.id === id)?.contentBase64;
  }

  remove(id: string): void {
    const list = this.items().filter((e) => e.id !== id);
    this.items.set(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }
}
