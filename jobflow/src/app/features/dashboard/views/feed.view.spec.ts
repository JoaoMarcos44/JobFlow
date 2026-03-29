import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FeedViewComponent } from './feed.view';
import { JobBoardService, CodanteJob, JobListResponse } from '../../../core/services/job-board.service';

vi.mock('../dashboard.animations', () => ({
  createDashboardViewStagger: () => ({ revert: vi.fn() }),
  animateElementsFrom: vi.fn(),
}));

function codanteJob(id: number, partial: Partial<CodanteJob> = {}): CodanteJob {
  return {
    id,
    title: 'Dev',
    company: 'ACME',
    company_website: '',
    city: 'Lisboa',
    schedule: 'full-time',
    salary: 0,
    description: 'Trabalho remoto.',
    requirements: 'JavaScript',
    created_at: '',
    updated_at: '',
    ...partial,
  };
}

function listResponse(data: CodanteJob[], meta: Partial<JobListResponse['meta']> = {}): JobListResponse {
  const m = {
    current_page: 1,
    from: data.length ? 1 : 0,
    last_page: 3,
    path: '',
    per_page: 10,
    to: data.length,
    total: 30,
    ...meta,
  };
  return {
    data,
    links: { first: '', last: '', prev: null, next: null },
    meta: m,
  };
}

describe('FeedViewComponent', () => {
  let getJobs: ReturnType<typeof vi.fn>;
  let localStore: Record<string, string>;

  beforeEach(() => {
    getJobs = vi.fn().mockReturnValue(of(listResponse([codanteJob(1)])));
    localStore = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => localStore[k] ?? null,
      setItem: (k: string, v: string) => {
        localStore[k] = v;
      },
      removeItem: (k: string) => {
        delete localStore[k];
      },
      clear: () => {
        Object.keys(localStore).forEach((k) => delete localStore[k]);
      },
      length: 0,
      key: () => null,
    });

    TestBed.configureTestingModule({
      imports: [FeedViewComponent],
      providers: [provideRouter([]), { provide: JobBoardService, useValue: { getJobs } }],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('caso de uso: ao abrir o feed pede vagas à API e deixa de estar em loading', async () => {
    const fixture = TestBed.createComponent(FeedViewComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(getJobs).toHaveBeenCalled();
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.error()).toBe(false);
    expect(fixture.componentInstance.jobs().length).toBe(1);
  });

  it('caso de uso: erro na API marca error e limpa response', async () => {
    getJobs.mockReturnValue(of(null));
    const fixture = TestBed.createComponent(FeedViewComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toBe(true);
    expect(fixture.componentInstance.response()).toBeNull();
  });

  it('caso de uso: clearFilters repõe vínculo, modo e habilidades', async () => {
    const fixture = TestBed.createComponent(FeedViewComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const cmp = fixture.componentInstance;
    cmp.setScheduleCategory('internship');
    cmp.setWorkModeFilter('remote');
    cmp.toggleSkillFilter('javascript');
    expect(cmp.hasActiveFilters()).toBe(true);
    cmp.clearFilters();
    expect(cmp.scheduleCategory()).toBe('all');
    expect(cmp.workModeFilter()).toBe('all');
    expect(cmp.selectedSkillIds()).toEqual([]);
    expect(cmp.hasActiveFilters()).toBe(false);
  });

  it('caso de uso: painel de habilidades começa fechado e abre ao alternar', async () => {
    const fixture = TestBed.createComponent(FeedViewComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#feed-skills-panel')).toBeNull();
    fixture.componentInstance.toggleSkillsPanel();
    fixture.detectChanges();
    expect(el.querySelector('#feed-skills-panel')).toBeTruthy();
  });

  it('caso de uso: na página 1 botão Anterior está disabled (paginação)', async () => {
    getJobs.mockReturnValue(of(listResponse([codanteJob(1)], { current_page: 1, last_page: 3 })));
    const fixture = TestBed.createComponent(FeedViewComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('.pagination button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    const anterior = buttons[0] as HTMLButtonElement;
    expect(anterior.textContent?.trim()).toBe('Anterior');
    expect(anterior.disabled).toBe(true);
  });

  it('caso de uso: estado vazio filtrado não mostra segundo botão Limpar (só texto)', async () => {
    getJobs.mockReturnValue(
      of(
        listResponse([codanteJob(1, { requirements: 'PHP' })], {
          current_page: 1,
          last_page: 1,
        }),
      ),
    );
    const fixture = TestBed.createComponent(FeedViewComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.toggleSkillFilter('javascript');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const empty = (fixture.nativeElement as HTMLElement).querySelector('.empty');
    expect(empty).toBeTruthy();
    expect(empty?.querySelector('button')).toBeNull();
  });

  it('companyInitial e scheduleLabel', async () => {
    const fixture = TestBed.createComponent(FeedViewComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const cmp = fixture.componentInstance;
    expect(cmp.companyInitial(' google ')).toBe('G');
    expect(cmp.scheduleLabel('full-time')).toBe('Tempo integral');
  });
});
