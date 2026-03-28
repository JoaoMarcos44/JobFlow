import {
  Component,
  signal,
  inject,
  ElementRef,
  afterNextRender,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { createAuthCardEntrance } from './auth-card.animations';

@Component({
  selector: 'app-recuperar-conta',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recuperar-conta.component.html',
  styleUrls: ['./login.component.scss'],
})
export class RecuperarContaComponent implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private ctx?: ReturnType<typeof createAuthCardEntrance>;

  readonly loading = signal(false);
  readonly message = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  email = '';

  constructor() {
    afterNextRender(() => {
      requestAnimationFrame(() => {
        this.ctx = createAuthCardEntrance(this.host.nativeElement);
      });
    });
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }

  sendEmail(): void {
    this.message.set(null);
    if (!this.email?.trim() || !this.email.includes('@')) {
      this.message.set({ text: 'Insira um e-mail válido.', type: 'error' });
      return;
    }
    this.loading.set(true);
    this.auth.requestPasswordReset(this.email).subscribe((result) => {
      this.loading.set(false);
      if (result.success) {
        this.message.set({
          text: 'Se existir uma conta com este e-mail, receberá instruções para redefinir a palavra-passe.',
          type: 'success',
        });
      } else {
        this.message.set({ text: result.error, type: 'error' });
      }
    });
  }
}
