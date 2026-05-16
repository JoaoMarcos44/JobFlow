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
  private readonly settings = inject(UserSettingsService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private entranceAnimation?: ReturnType<typeof mountDashboardView>;

  currentPassword = '';
  newPassword = '';
  newEmail = '';
  emailPassword = '';
  msgPassword = '';
  msgEmail = '';
  msgPasswordSuccess = false;
  msgEmailSuccess = false;

  readonly savingPassword = signal(false);
  readonly savingEmail = signal(false);

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
    this.msgPassword = '';
    this.settings.changePassword(this.currentPassword, this.newPassword).subscribe((result) => {
      this.savingPassword.set(false);
      if (result.success) {
        this.msgPassword = 'Palavra-passe atualizada.';
        this.msgPasswordSuccess = true;
        this.currentPassword = '';
        this.newPassword = '';
      } else {
        this.msgPassword = result.error;
        this.msgPasswordSuccess = false;
      }
    });
  }

  onSubmitEmail(): void {
    if (this.savingEmail()) return;
    this.savingEmail.set(true);
    this.msgEmail = '';
    this.settings.changeEmail(this.newEmail, this.emailPassword).subscribe((result) => {
      this.savingEmail.set(false);
      if (result.success) {
        this.msgEmail = 'E-mail atualizado. Pode ser necessário iniciar sessão novamente.';
        this.msgEmailSuccess = true;
        this.newEmail = '';
        this.emailPassword = '';
      } else {
        this.msgEmail = result.error;
        this.msgEmailSuccess = false;
      }
    });
  }
}
