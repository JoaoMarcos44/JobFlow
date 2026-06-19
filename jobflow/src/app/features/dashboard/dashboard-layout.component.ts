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
import { SavedJobsService } from '../../core/services/saved-jobs.service';
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
  private readonly authService = inject(AuthService);
  private readonly savedJobsService = inject(SavedJobsService);
  private readonly router = inject(Router);
  protected readonly themeService = inject(ThemeService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private shellEntranceAnimation?: ReturnType<typeof createDashboardShellEntrance>;

  profileMenuOpen = false;
  userName = 'Utilizador';
  userEmail = '—';
  userInitials = '?';

  constructor() {
    afterNextRender(() => {
      requestAnimationFrame(() => {
        const shell = this.host.nativeElement.querySelector('.dashboard-shell') as HTMLElement | null;
        if (shell) {
          this.shellEntranceAnimation = createDashboardShellEntrance(shell);
        }
      });
    });
  }

  ngOnInit(): void {
    this.loadProfile();
    this.savedJobsService.reloadFromApi();
  }

  ngOnDestroy(): void {
    this.shellEntranceAnimation?.revert();
  }

  private loadProfile(): void {
    const token = this.authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1])) as { sub?: string; email?: string };
        const email = payload.email ?? payload.sub;
        this.userEmail = email || '—';
        this.userName = email ? email.split('@')[0] : 'Utilizador';
        this.userInitials = this.userName.slice(0, 2).toUpperCase();
      } catch {
        this.userInitials = '?';
      }
    }
  }

  logout(): void {
    this.authService.removeToken();
    this.profileMenuOpen = false;
    this.router.navigate(['/login']);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.profileMenuOpen = false;
  }
}
