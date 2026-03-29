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
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  private ctx?: ReturnType<typeof createAuthCardEntrance>;

  constructor() {
    afterNextRender(() => {
      this.ctx = createAuthCardEntrance(this.host.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }

  readonly loading = signal(false);
  readonly message = signal<{ text: string; type: 'success' | 'error' } | null>(null);
  readonly showDemoLink = signal(false);

  email = '';
  password = '';
  remember = false;

  onSubmit(): void {
    this.message.set(null);
    this.showDemoLink.set(false);

    if (!this.email?.includes('@')) {
      this.message.set({ text: 'Insira um e-mail válido.', type: 'error' });
      return;
    }
    if (!this.password || this.password.length < 6) {
      this.message.set({ text: 'A palavra-passe deve ter pelo menos 6 caracteres.', type: 'error' });
      return;
    }

    this.loading.set(true);
    this.auth.login(this.email, this.password).subscribe((result) => {
      this.loading.set(false);
      if (result.success) {
        this.message.set({ text: 'Login efetuado com sucesso. A redirecionar...', type: 'success' });
        this.router.navigate(['/dashboard/feed']);
      } else {
        const isNetwork =
          result.error.includes('rede') ||
          result.error.includes('fetch') ||
          result.error.includes('Network') ||
          result.error.includes('Failed');
        this.message.set({ text: result.error, type: 'error' });
        if (isNetwork) {
          this.showDemoLink.set(true);
        }
      }
    });
  }

  goToFeedDemo(): void {
    this.router.navigate(['/dashboard/feed']);
  }
}
