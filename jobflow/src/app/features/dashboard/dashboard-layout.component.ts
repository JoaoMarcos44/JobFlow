import { Component, OnInit, inject, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss'],
})
export class DashboardLayoutComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  profileMenuOpen = false;
  userName = 'Utilizador';
  userEmail = '—';
  userInitials = '?';

  ngOnInit(): void {
    this.loadProfile();
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
