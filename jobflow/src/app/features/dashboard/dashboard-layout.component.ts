import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Layout do dashboard (sidebar + área de conteúdo).
 * O conteúdo real do dashboard está em public/dashboard.html.
 * Esta estrutura segue o padrão Angular: features/dashboard com rotas filhas.
 */
@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="dashboard-shell">
      <aside class="sidebar">
        <div class="brand">JobFlow</div>
        <nav>
          <a routerLink="feed" routerLinkActive="active">Feed de Vagas</a>
          <a routerLink="candidaturas" routerLinkActive="active">Candidaturas</a>
          <a routerLink="analytics" routerLinkActive="active">Analytics</a>
          <a routerLink="curriculos" routerLinkActive="active">Currículos</a>
          <a routerLink="definicoes" routerLinkActive="active">Definições</a>
        </nav>
      </aside>
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .dashboard-shell { display: flex; min-height: 100vh; }
    .sidebar { width: 260px; background: #0f172a; padding: 24px; }
    .brand { font-size: 22px; font-weight: 800; margin-bottom: 24px; color: #f8fafc; }
    .sidebar nav { display: flex; flex-direction: column; gap: 8px; }
    .sidebar a { color: #94a3b8; text-decoration: none; padding: 12px 16px; border-radius: 8px; }
    .sidebar a:hover { background: #1e293b; color: #f8fafc; }
    .sidebar a.active { background: rgba(6,182,212,0.1); color: #06b6d4; }
    .content { flex: 1; padding: 24px; background: #020617; color: #f8fafc; }
  `],
})
export class DashboardLayoutComponent {}
