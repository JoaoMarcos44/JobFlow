import { Injectable, signal } from '@angular/core';
import { decryptResumePayload, encryptResumePayload } from '../crypto/resume-storage-crypto';

const STORAGE_KEY = 'jobflow_resumes';
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB (localStorage limit ~5MB)

export interface ResumeEntry {
  id: string;
  fileName: string;
  uploadedAt: string;
  mimeType?: string;
  /** AES-GCM payload; iv + ciphertext as hex (not Base64). */
  contentCipher?: { ivHex: string; cipherHex: string };
}

@Injectable({ providedIn: 'root' })
export class ResumesService {
  private readonly items = signal<ResumeEntry[]>(this.loadFromStorage());
  private migrationPromise: Promise<void> | null = null;

  readonly list = this.items.asReadonly();

  constructor() {
    void this.ensureLegacyMigrated();
  }

  private loadFromStorage(): ResumeEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown[];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((e): e is ResumeEntry => e !== null && typeof e === 'object' && 'id' in e && 'fileName' in e) as ResumeEntry[];
    } catch {
      return [];
    }
  }

  private persist(list: ResumeEntry[]): void {
    this.items.set(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // quota – keep last good list in memory only
    }
  }

  /**
   * One-time migration: legacy entries used Base64 in JSON; re-encrypt with AES-GCM and drop Base64.
   */
  private async ensureLegacyMigrated(): Promise<void> {
    if (this.migrationPromise) return this.migrationPromise;
    this.migrationPromise = (async () => {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      let parsed: unknown[];
      try {
        parsed = JSON.parse(raw) as unknown[];
      } catch {
        return;
      }
      if (!Array.isArray(parsed)) return;

      let changed = false;
      const next: ResumeEntry[] = [];

      for (const row of parsed) {
        if (!row || typeof row !== 'object') continue;
        const o = row as Record<string, unknown>;
        const id = o['id'];
        const fileName = o['fileName'];
        const uploadedAt = o['uploadedAt'];
        if (typeof id !== 'string' || typeof fileName !== 'string' || typeof uploadedAt !== 'string') continue;

        const legacyB64 = o['contentBase64'];
        const mimeType = typeof o['mimeType'] === 'string' ? o['mimeType'] : undefined;
        const existingCipher = o['contentCipher'];

        if (
          existingCipher &&
          typeof existingCipher === 'object' &&
          existingCipher !== null &&
          typeof (existingCipher as Record<string, unknown>)['ivHex'] === 'string' &&
          typeof (existingCipher as Record<string, unknown>)['cipherHex'] === 'string'
        ) {
          next.push({
            id,
            fileName,
            uploadedAt,
            mimeType,
            contentCipher: {
              ivHex: (existingCipher as { ivHex: string }).ivHex,
              cipherHex: (existingCipher as { cipherHex: string }).cipherHex,
            },
          });
          continue;
        }

        if (typeof legacyB64 === 'string' && legacyB64.length > 0) {
          try {
            const binary = legacyB64.includes(',') ? legacyB64.split(',')[1] ?? legacyB64 : legacyB64;
            const binStr = atob(binary);
            const bytes = new Uint8Array(binStr.length);
            for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
            const contentCipher = await encryptResumePayload(bytes);
            next.push({ id, fileName, uploadedAt, mimeType, contentCipher });
            changed = true;
          } catch {
            next.push({ id, fileName, uploadedAt, mimeType });
            changed = true;
          }
          continue;
        }

        next.push({ id, fileName, uploadedAt, mimeType });
      }

      if (changed) {
        this.persist(next);
      }
    })();
    return this.migrationPromise;
  }

  add(file: File): Promise<{ entry: ResumeEntry; error?: string }> {
    return (async () => {
      await this.ensureLegacyMigrated();
      if (file.size > MAX_FILE_SIZE) {
        return {
          entry: this.addMetadataOnly(file.name),
          error: 'Ficheiro demasiado grande (máx. 4 MB). Guardado apenas o nome.',
        };
      }
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          void (async () => {
            try {
              const buf = reader.result as ArrayBuffer;
              const plain = new Uint8Array(buf);
              const contentCipher = await encryptResumePayload(plain);
              const mime = file.type || 'application/octet-stream';
              const entry: ResumeEntry = {
                id: crypto.randomUUID(),
                fileName: file.name,
                uploadedAt: new Date().toISOString(),
                mimeType: mime,
                contentCipher,
              };
              const list = [...this.items(), entry];
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
                this.items.set(list);
              } catch {
                const fallback: ResumeEntry = { ...entry, contentCipher: undefined, mimeType: undefined };
                const list2 = [...this.items(), fallback];
                this.persist(list2);
                resolve({ entry: fallback, error: 'Armazenamento cheio; guardado apenas o nome.' });
                return;
              }
              resolve({ entry });
            } catch {
              resolve({ entry: this.addMetadataOnly(file.name), error: 'Não foi possível encriptar o ficheiro.' });
            }
          })();
        };
        reader.onerror = () =>
          resolve({ entry: this.addMetadataOnly(file.name), error: 'Não foi possível ler o ficheiro.' });
        reader.readAsArrayBuffer(file);
      });
    })();
  }

  private addMetadataOnly(fileName: string): ResumeEntry {
    const entry: ResumeEntry = {
      id: crypto.randomUUID(),
      fileName,
      uploadedAt: new Date().toISOString(),
    };
    const list = [...this.items(), entry];
    this.persist(list);
    return entry;
  }

  async download(id: string): Promise<boolean> {
    await this.ensureLegacyMigrated();
    const entry = this.items().find((e) => e.id === id);
    if (!entry?.contentCipher) return false;
    try {
      const plain = await decryptResumePayload(entry.contentCipher.ivHex, entry.contentCipher.cipherHex);
      const blob = new Blob([new Uint8Array(plain)], { type: entry.mimeType ?? 'application/octet-stream' });
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
    return !!this.items().find((e) => e.id === id)?.contentCipher;
  }

  remove(id: string): void {
    const list = this.items().filter((e) => e.id !== id);
    this.persist(list);
  }
}
