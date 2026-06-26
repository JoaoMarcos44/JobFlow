import { Component, inject, signal, ElementRef, ViewChild, afterNextRender, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResumesService } from '../../../core/services/resumes.service';
import { AiService, AiResumeAnalysis } from '../../../core/services/ai.service';
import { mountDashboardView, viewRoot } from '../dashboard-view-host';

@Component({
  selector: 'app-curriculos-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './curriculos.view.html',
  styleUrls: ['./curriculos.view.scss'],
})
export class CurriculosViewComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') private fileInputRef!: ElementRef<HTMLInputElement>;

  private readonly resumesService = inject(ResumesService);
  private readonly aiService = inject(AiService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private entranceAnimation?: ReturnType<typeof mountDashboardView>;

  selectedFile: File | null = null;
  selectedFileName = '';
  saving = false;
  readonly uploadMsg = signal<{ text: string; success: boolean } | null>(null);
  private replaceForId: string | null = null;

  readonly extractingFor = signal<string | null>(null);
  readonly aiResult = signal<AiResumeAnalysis | null>(null);
  readonly aiResultFor = signal<string | null>(null);
  readonly aiError = signal<string | null>(null);

  readonly resumeList = this.resumesService.list;

  constructor() {
    afterNextRender(() => {
      requestAnimationFrame(() => {
        const root = viewRoot(this.host.nativeElement, '.curriculos-view');
        this.entranceAnimation = mountDashboardView(root);
      });
    });
  }

  ngOnInit(): void {
    this.resumesService.reloadFromApi();
  }

  ngOnDestroy(): void {
    this.entranceAnimation?.revert();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.selectedFile = file ?? null;
    this.selectedFileName = file ? file.name : '';
    this.uploadMsg.set(null);
  }

  onSubmit(): void {
    if (!this.selectedFile) {
      this.uploadMsg.set({ text: 'Selecione um ficheiro PDF ou DOCX.', success: false });
      return;
    }
    this.saving = true;
    this.uploadMsg.set(null);
    this.resumesService.add(this.selectedFile).subscribe((result) => {
      this.saving = false;
      this.uploadMsg.set(
        result.success
          ? { text: 'Currículo guardado com sucesso.', success: true }
          : { text: result.error, success: false },
      );
      this.selectedFile = null;
      this.selectedFileName = '';
      if (this.fileInputRef?.nativeElement) this.fileInputRef.nativeElement.value = '';
    });
  }

  downloadResume(id: string): void {
    void this.resumesService.download(id);
  }

  canDownload(id: string): boolean {
    return this.resumesService.hasDownload(id);
  }

  removeResume(event: Event, id: string): void {
    event.stopPropagation();
    event.preventDefault();
    this.resumesService.remove(id);
  }

  openReplace(id: string): void {
    this.replaceForId = id;
    const fileInput = document.getElementById('resume-replace-file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
      fileInput.click();
    }
  }

  onReplaceSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const id = this.replaceForId;
    this.replaceForId = null;
    if (!file || !id) return;
    this.saving = true;
    this.uploadMsg.set(null);
    this.resumesService.replace(id, file).subscribe((result) => {
      this.saving = false;
      this.uploadMsg.set(
        result.success
          ? { text: 'Currículo atualizado.', success: true }
          : { text: result.error, success: false },
      );
      input.value = '';
    });
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  }

  extractSkills(resumeId: string): void {
    this.extractingFor.set(resumeId);
    this.aiResult.set(null);
    this.aiResultFor.set(null);
    this.aiError.set(null);
    this.aiService.extractSkillsFromResume(resumeId).subscribe((result) => {
      this.extractingFor.set(null);
      if ('data' in result) {
        this.aiResult.set(result.data);
        this.aiResultFor.set(resumeId);
      } else {
        this.aiError.set(result.error);
      }
    });
  }

  closeAiResult(): void {
    this.aiResult.set(null);
    this.aiResultFor.set(null);
    this.aiError.set(null);
  }
}
