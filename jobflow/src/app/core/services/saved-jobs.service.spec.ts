import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SavedJobsService } from './saved-jobs.service';
import type { CodanteJob } from './job-board.service';

function job(id: number): CodanteJob {
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

describe('SavedJobsService', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
      length: 0,
      key: () => null,
    });
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('caso de uso: adicionar vaga nova devolve true e passa a constar como guardada', () => {
    const service = TestBed.inject(SavedJobsService);
    expect(service.addJob(job(1))).toBe(true);
    expect(service.isSaved(1)).toBe(true);
    expect(service.getSavedJobs().length).toBe(1);
  });

  it('caso de uso: adicionar a mesma vaga duas vezes devolve false', () => {
    const service = TestBed.inject(SavedJobsService);
    expect(service.addJob(job(2))).toBe(true);
    expect(service.addJob(job(2))).toBe(false);
    expect(service.getSavedJobs().length).toBe(1);
  });

  it('caso de uso: removeJob remove o item', () => {
    const service = TestBed.inject(SavedJobsService);
    service.addJob(job(3));
    service.removeJob('codante-3');
    expect(service.isSaved(3)).toBe(false);
    expect(service.getSavedJobs().length).toBe(0);
  });

  it('caso de uso: updateStatus altera o estado Kanban', () => {
    const service = TestBed.inject(SavedJobsService);
    service.addJob(job(4));
    service.updateStatus('codante-4', 'applied');
    expect(service.getSavedJobs()[0].status).toBe('applied');
  });
});
