import { Component, inject, ElementRef, afterNextRender, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResumesService } from '../../../core/services/resumes.service';
import { createDashboardViewStagger } from '../dashboard.animations';

@Component({
  selector: 'app-curriculos-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './curriculos.view.html',
  styleUrls: ['./curriculos.view.scss'],
})
export class CurriculosViewComponent implements OnInit, OnDestroy {
  private readonly resumes = inject(ResumesService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private viewCtx?: ReturnType<typeof createDashboardViewStagger>;

  ngOnInit(): void {
    this.resumes.reloadFromApi();
  }

  constructor() {
    afterNextRender(() => {
      requestAnimationFrame(() => {
        const root =
          (this.host.nativeElement.querySelector('.curriculos-view') as HTMLElement) ??
          this.host.nativeElement;
        this.viewCtx = createDashboardViewStagger(root);
      });
    });
  }

  ngOnDestroy(): void {
    this.viewCtx?.revert();
  }

  selectedFile: File | null = null;
  selectedFileName = '';
  message = '';
  messageSuccess = false;
  saving = false;
  private replaceForId: string | null = null;

  readonly resumeList = this.resumes.list;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.selectedFile = file ?? null;
    this.selectedFileName = file ? file.name : '';
    this.message = '';
  }

  onSubmit(): void {
    if (!this.selectedFile) {
      this.message = 'Selecione um ficheiro PDF ou DOCX.';
      this.messageSuccess = false;
      return;
    }
    this.saving = true;
    this.message = '';
    this.resumes.add(this.selectedFile).subscribe((r) => {
      this.saving = false;
      if (r.success) {
        this.message = 'Currículo guardado com sucesso.';
        this.messageSuccess = true;
      } else {
        this.message = r.error;
        this.messageSuccess = false;
      }
      this.selectedFile = null;
      this.selectedFileName = '';
      const input = document.getElementById('resume-file') as HTMLInputElement;
      if (input) input.value = '';
    });
  }

  downloadResume(id: string): void {
    void this.resumes.download(id);
  }

  canDownload(id: string): boolean {
    return this.resumes.hasDownload(id);
  }

  removeResume(event: Event, id: string): void {
    event.stopPropagation();
    event.preventDefault();
    this.resumes.remove(id);
  }

  openReplace(id: string): void {
    this.replaceForId = id;
    const el = document.getElementById('resume-replace-file') as HTMLInputElement;
    if (el) {
      el.value = '';
      el.click();
    }
  }

  onReplaceSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const id = this.replaceForId;
    this.replaceForId = null;
    if (!file || !id) return;
    this.saving = true;
    this.message = '';
    this.resumes.replace(id, file).subscribe((r) => {
      this.saving = false;
      if (r.success) {
        this.message = 'Currículo atualizado.';
        this.messageSuccess = true;
      } else {
        this.message = r.error;
        this.messageSuccess = false;
      }
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
}
