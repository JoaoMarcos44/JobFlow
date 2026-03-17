import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResumesService } from '../../../core/services/resumes.service';

@Component({
  selector: 'app-curriculos-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './curriculos.view.html',
  styleUrls: ['./curriculos.view.scss'],
})
export class CurriculosViewComponent {
  private readonly resumes = inject(ResumesService);

  selectedFile: File | null = null;
  selectedFileName = '';
  message = '';
  messageSuccess = false;
  saving = false;

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
    this.resumes.add(this.selectedFile).then(({ entry, error }) => {
      this.saving = false;
      this.message = error ?? 'Currículo guardado com sucesso.';
      this.messageSuccess = !error;
      this.selectedFile = null;
      this.selectedFileName = '';
      const input = document.getElementById('resume-file') as HTMLInputElement;
      if (input) input.value = '';
    });
  }

  downloadResume(id: string): void {
    this.resumes.download(id);
  }

  canDownload(id: string): boolean {
    return this.resumes.hasDownload(id);
  }

  removeResume(event: Event, id: string): void {
    event.stopPropagation();
    event.preventDefault();
    this.resumes.remove(id);
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
