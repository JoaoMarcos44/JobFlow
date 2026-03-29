import {
  Component,
  signal,
  inject,
  ElementRef,
  afterNextRender,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { createAuthCardEntrance } from './auth-card.animations';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./login.component.scss'],
})
export class RegisterComponent implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  private ctx?: ReturnType<typeof createAuthCardEntrance>;

  readonly loading = signal(false);
  readonly message = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  name = '';
  email = '';
  password = '';
  passwordConfirm = '';

  constructor() {
    afterNextRender(() => {
      this.ctx = createAuthCardEntrance(this.host.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }

  onSubmit(): void {
    this.message.set(null);

    if (!this.email?.trim() || !this.email.includes('@')) {
      this.message.set({ text: 'Insira um e-mail válido.', type: 'error' });
      return;
    }
    if (!this.password || this.password.length < 6) {
      this.message.set({ text: 'A palavra-passe deve ter pelo menos 6 caracteres.', type: 'error' });
      return;
    }
    if (this.password !== this.passwordConfirm) {
      this.message.set({ text: 'As palavras-passe não coincidem.', type: 'error' });
      return;
    }

    this.loading.set(true);
    this.auth
      .register({
        name: this.name || undefined,
        email: this.email,
        password: this.password,
      })
      .subscribe((result) => {
        this.loading.set(false);
        if (result.success) {
          this.message.set({ text: 'Conta criada. A redirecionar...', type: 'success' });
          this.router.navigate(['/dashboard/feed']);
        } else {
          this.message.set({ text: result.error, type: 'error' });
        }
      });
  }
}
