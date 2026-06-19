import { Component, inject, ElementRef, afterNextRender, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserSettingsService } from '../../../core/services/user-settings.service';
import { mountDashboardView, viewRoot } from '../dashboard-view-host';

@Component({
  selector: 'app-definicoes-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './definicoes.view.html',
  styleUrls: ['./definicoes.view.scss'],
})
export class DefinicoesViewComponent implements OnDestroy {
  private readonly userSettingsService = inject(UserSettingsService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private entranceAnimation?: ReturnType<typeof mountDashboardView>;

  currentPassword = '';
  newPassword = '';
  newEmail = '';
  emailPassword = '';

  readonly savingPassword = signal(false);
  readonly savingEmail = signal(false);
  readonly msgPassword = signal<{ text: string; success: boolean } | null>(null);
  readonly msgEmail = signal<{ text: string; success: boolean } | null>(null);

  constructor() {
    afterNextRender(() => {
      requestAnimationFrame(() => {
        const root = viewRoot(this.host.nativeElement, '.definicoes-view');
        this.entranceAnimation = mountDashboardView(root, {
          selector: '.settings-section',
          vars: { y: 18, opacity: 0, duration: 0.4, stagger: 0.1, ease: 'power3.out' },
        });
      });
    });
  }

  ngOnDestroy(): void {
    this.entranceAnimation?.revert();
  }

  onSubmitPassword(): void {
    if (this.savingPassword()) return;
    this.savingPassword.set(true);
    this.msgPassword.set(null);
    this.userSettingsService.changePassword(this.currentPassword, this.newPassword).subscribe((result) => {
      this.savingPassword.set(false);
      if (result.success) {
        this.msgPassword.set({ text: 'Palavra-passe atualizada.', success: true });
        this.currentPassword = '';
        this.newPassword = '';
      } else {
        this.msgPassword.set({ text: result.error, success: false });
      }
    });
  }

  onSubmitEmail(): void {
    if (this.savingEmail()) return;
    this.savingEmail.set(true);
    this.msgEmail.set(null);
    this.userSettingsService.changeEmail(this.newEmail, this.emailPassword).subscribe((result) => {
      this.savingEmail.set(false);
      if (result.success) {
        this.msgEmail.set({ text: 'E-mail atualizado. Pode ser necessário iniciar sessão novamente.', success: true });
        this.newEmail = '';
        this.emailPassword = '';
      } else {
        this.msgEmail.set({ text: result.error, success: false });
      }
    });
  }
}
