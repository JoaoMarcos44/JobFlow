import { describe, it, expect } from 'vitest';
import type { CodanteJob } from '../../../core/services/job-board.service';
import {
  inferWorkMode,
  matchesScheduleCategory,
  matchesWorkModeFilter,
  matchesSelectedSkills,
  filterJobs,
} from './feed-filters';

function job(partial: Partial<CodanteJob>): CodanteJob {
  return {
    id: 1,
    title: '',
    company: 'C',
    company_website: '',
    city: '',
    schedule: 'full-time',
    salary: 0,
    description: '',
    requirements: '',
    created_at: '',
    updated_at: '',
    ...partial,
  };
}

describe('feed-filters', () => {
  it('inferWorkMode: remoto na descrição', () => {
    expect(inferWorkMode(job({ description: 'Trabalho 100% remoto' }))).toBe('remote');
  });

  it('inferWorkMode: presencial', () => {
    expect(inferWorkMode(job({ description: 'Atuação presencial em Lisboa' }))).toBe('onsite');
  });

  it('inferWorkMode: híbrido', () => {
    expect(inferWorkMode(job({ title: 'Dev', requirements: 'Regime híbrido' }))).toBe('hybrid');
  });

  it('matchesScheduleCategory: estágio', () => {
    expect(matchesScheduleCategory(job({ schedule: 'internship' }), 'internship')).toBe(true);
    expect(matchesScheduleCategory(job({ schedule: 'full-time' }), 'internship')).toBe(false);
  });

  it('matchesScheduleCategory: emprego exclui estágio', () => {
    expect(matchesScheduleCategory(job({ schedule: 'internship' }), 'employment')).toBe(false);
    expect(matchesScheduleCategory(job({ schedule: 'full-time' }), 'employment')).toBe(true);
  });

  it('filterJobs combina filtros', () => {
    const jobs = [
      job({ id: 1, schedule: 'internship', description: 'remoto' }),
      job({ id: 2, schedule: 'full-time', description: 'remoto' }),
      job({ id: 3, schedule: 'full-time', description: 'presencial' }),
    ];
    const out = filterJobs(jobs, 'employment', 'remote', []);
    expect(out.map((j) => j.id)).toEqual([2]);
  });

  it('matchesSelectedSkills: exige todas as skills escolhidas', () => {
    const j = job({ requirements: 'PHP 8+ e Laravel; JavaScript moderno' });
    expect(matchesSelectedSkills(j, [])).toBe(true);
    expect(matchesSelectedSkills(j, ['php'])).toBe(true);
    expect(matchesSelectedSkills(j, ['php', 'javascript'])).toBe(true);
    expect(matchesSelectedSkills(j, ['php', 'java'])).toBe(false);
  });

  it('filterJobs aplica skills', () => {
    const jobs = [
      job({ id: 1, requirements: 'Vue.js e React' }),
      job({ id: 2, requirements: 'Somente PHP' }),
      job({ id: 3, requirements: 'PHP 8+ e React.js no mesmo projeto' }),
    ];
    expect(filterJobs(jobs, 'all', 'all', ['react']).map((x) => x.id)).toEqual([1, 3]);
    expect(filterJobs(jobs, 'all', 'all', ['php', 'react']).map((x) => x.id)).toEqual([3]);
  });
});
