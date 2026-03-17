import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard-layout.component').then((m) => m.DashboardLayoutComponent),
    children: [
      { path: '', redirectTo: 'feed', pathMatch: 'full' },
      {
        path: 'feed',
        loadComponent: () =>
          import('./features/dashboard/views/feed.view').then((m) => m.FeedViewComponent),
      },
      {
        path: 'candidaturas',
        loadComponent: () =>
          import('./features/dashboard/views/candidaturas.view').then((m) => m.CandidaturasViewComponent),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/dashboard/views/analytics.view').then((m) => m.AnalyticsViewComponent),
      },
      {
        path: 'curriculos',
        loadComponent: () =>
          import('./features/dashboard/views/curriculos.view').then((m) => m.CurriculosViewComponent),
      },
      {
        path: 'definicoes',
        loadComponent: () =>
          import('./features/dashboard/views/definicoes.view').then((m) => m.DefinicoesViewComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
