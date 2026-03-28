import {
  Component,
  OnInit,
  inject,
  HostListener,
  ElementRef,
  afterNextRender,
  OnDestroy,
} from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { createDashboardShellEntrance } from './dashboard.animations';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss'],
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly theme = inject(ThemeService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private shellCtx?: ReturnType<typeof createDashboardShellEntrance>;

  profileMenuOpen = false;
  userName = 'Utilizador';
  userEmail = '—';
  userInitials = '?';

  constructor() {
    afterNextRender(() => {
      requestAnimationFrame(() => {
        const shell = this.host.nativeElement.querySelector('.dashboard-shell') as HTMLElement | null;
        if (shell) {
          this.shellCtx = createDashboardShellEntrance(shell);
        }
      });
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.shellCtx?.revert();
  }

  private loadProfile(): void {
    const token = this.auth.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.userEmail = payload.email || '—';
        this.userName = payload.email ? payload.email.split('@')[0] : 'Utilizador';
        this.userInitials = this.userName.slice(0, 2).toUpperCase();
      } catch {
        this.userInitials = '?';
      }
    }
  }

  logout(): void {
    this.auth.removeToken();
    this.profileMenuOpen = false;
    this.router.navigate(['/login']);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.profileMenuOpen = false;
  }
}
