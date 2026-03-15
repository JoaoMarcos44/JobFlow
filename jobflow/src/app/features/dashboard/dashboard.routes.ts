import { Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
  { path: '', redirectTo: 'candidaturas', pathMatch: 'full' },
  { path: 'feed', loadComponent: () => import('./views/feed.view').then(m => m.FeedViewComponent) },
  { path: 'candidaturas', loadComponent: () => import('./views/candidaturas.view').then(m => m.CandidaturasViewComponent) },
  { path: 'analytics', loadComponent: () => import('./views/analytics.view').then(m => m.AnalyticsViewComponent) },
  { path: 'curriculos', loadComponent: () => import('./views/curriculos.view').then(m => m.CurriculosViewComponent) },
  { path: 'definicoes', loadComponent: () => import('./views/definicoes.view').then(m => m.DefinicoesViewComponent) },
];
