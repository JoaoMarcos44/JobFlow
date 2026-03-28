import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'welcome' },
  {
    path: 'welcome',
    loadComponent: () =>
      import('./features/welcome/welcome.component').then((m) => m.WelcomeComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'recuperar-conta',
    loadComponent: () =>
      import('./features/auth/recuperar-conta.component').then((m) => m.RecuperarContaComponent),
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
  { path: '**', redirectTo: 'welcome' },
];
