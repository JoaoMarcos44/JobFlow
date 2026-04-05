import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { SavedJobsService } from './saved-jobs.service';
import type { CodanteJob } from './job-board.service';

function codanteJob(id: number): CodanteJob {
  return {
    id,
    title: 'T',
    company: 'C',
    company_website: '',
    city: '',
    schedule: 'full-time',
    salary: 0,
    description: '',
    requirements: '',
    created_at: '',
    updated_at: '',
  };
}

function savedRow(id: string, codanteId: number, status = 'saved') {
  return {
    id,
    job: {
      id: 'job-uuid',
      title: 'T',
      company: 'C',
      codanteId,
    },
    notes: null,
    matchScore: 80,
    status,
    savedAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

describe('SavedJobsService', () => {
  let httpMock: HttpTestingController;
  let service: SavedJobsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SavedJobsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it('reloadFromApi preenche lista a partir de Page.content', () => {
    service.reloadFromApi();
    const req = httpMock.expectOne((r) => r.url.includes('/api/saved-jobs'));
    expect(req.request.method).toBe('GET');
    req.flush({ content: [savedRow('s1', 5)] });
    expect(service.getSavedJobs().length).toBe(1);
    expect(service.isSaved(5)).toBe(true);
  });

  it('addJob POST /from-codante e devolve true', async () => {
    const p = firstValueFrom(service.addJob(codanteJob(9)));
    const req = httpMock.expectOne((r) => r.url.endsWith('/from-codante'));
    expect(req.request.method).toBe('POST');
    req.flush(savedRow('new-id', 9));
    expect(await p).toBe(true);
    expect(service.isSaved(9)).toBe(true);
  });

  it('addJob em erro devolve false', async () => {
    const p = firstValueFrom(service.addJob(codanteJob(9)));
    httpMock.expectOne((r) => r.url.includes('from-codante')).flush({}, { status: 400, statusText: 'Bad' });
    expect(await p).toBe(false);
  });
});
