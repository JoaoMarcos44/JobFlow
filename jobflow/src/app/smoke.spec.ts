/**
 * SMOKE — conjunto mínimo de verificações para regressão rápida.
 * Cobre rotas, regras de negócio do feed e contratos HTTP básicos.
 * Executar: npm run test:ci (inclui estes testes) ou filtrar por "SMOKE" no IDE.
 */
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { filterJobs } from './features/dashboard/views/feed-filters';
import { JobBoardService } from './core/services/job-board.service';

describe('SMOKE — regressão crítica', () => {
  it('rotas: dashboard inclui feed, currículos e definições', () => {
    const dash = routes.find((r) => r.path === 'dashboard');
    const children = dash && 'children' in dash ? dash.children ?? [] : [];
    const paths = children.map((c) => c.path).filter(Boolean);
    expect(paths).toContain('feed');
    expect(paths).toContain('curriculos');
    expect(paths).toContain('definicoes');
  });

  it('filterJobs: lista vazia e filtros default devolvem vazio', () => {
    expect(filterJobs([], 'all', 'all', [])).toEqual([]);
  });

});

describe('SMOKE — JobBoardService (HTTP)', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('pedido GET à API de job-board', async () => {
    const service = TestBed.inject(JobBoardService);
    const p = firstValueFrom(service.getJobs({ page: 1 }));
    const req = httpMock.expectOne((r) => r.url.includes('/codante-api/api/job-board/jobs'));
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [],
      links: { first: '', last: '', prev: null, next: null },
      meta: {
        current_page: 1,
        from: 0,
        last_page: 1,
        path: '',
        per_page: 10,
        to: 0,
        total: 0,
      },
    });
    await p;
  });
});
