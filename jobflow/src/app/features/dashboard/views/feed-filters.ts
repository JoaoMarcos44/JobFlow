import type { CodanteJob } from '../../../core/services/job-board.service';

export type ScheduleCategory = 'all' | 'internship' | 'employment';

export type WorkMode = 'remote' | 'onsite' | 'hybrid' | 'unknown';

/** Filtro UI (sem "unknown" isolado — entra em Presencial por omissão). */
export type WorkModeFilter = 'all' | 'remote' | 'onsite' | 'hybrid';

export interface FeedSkillOption {
  id: string;
  label: string;
}

/**
 * Chips de habilidades (a API Codante não devolve array de skills; fazemos match em título/descrição/requisitos).
 * Cada id tem um padrão em SKILL_PATTERNS.
 */
export const FEED_SKILL_OPTIONS: FeedSkillOption[] = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'java', label: 'Java' },
  { id: 'python', label: 'Python' },
  { id: 'php', label: 'PHP' },
  { id: 'go', label: 'Go' },
  { id: 'csharp', label: 'C#' },
  { id: 'kotlin', label: 'Kotlin' },
  { id: 'swift', label: 'Swift' },
  { id: 'react', label: 'React' },
  { id: 'vue', label: 'Vue' },
  { id: 'angular', label: 'Angular' },
  { id: 'node', label: 'Node.js' },
  { id: 'laravel', label: 'Laravel' },
  { id: 'docker', label: 'Docker' },
  { id: 'kubernetes', label: 'Kubernetes' },
  { id: 'aws', label: 'AWS' },
  { id: 'sql', label: 'SQL' },
  { id: 'graphql', label: 'GraphQL' },
];

const SKILL_PATTERNS: Record<string, RegExp> = {
  javascript: /\b(javascript|js\.?)\b/i,
  typescript: /\btypescript\b/i,
  java: /\bjava\b/i,
  python: /\bpython\b/i,
  php: /\bphp\b/i,
  go: /\bgo\b/i,
  csharp: /\b(c#|csharp|\.net)\b/i,
  kotlin: /\bkotlin\b/i,
  swift: /\bswift\b/i,
  react: /\breact(\.js)?\b/i,
  vue: /\bvue(\.js)?\b/i,
  angular: /\bangular\b/i,
  node: /\bnode(\.js)?\b/i,
  laravel: /\blaravel\b/i,
  docker: /\bdocker\b/i,
  kubernetes: /\b(kubernetes|k8s)\b/i,
  aws: /\baws\b/i,
  sql: /\bsql\b/i,
  graphql: /\bgraphql\b/i,
};

function jobTextForMatching(job: CodanteJob): string {
  const raw = `${job.title}\n${job.description}\n${job.requirements}`;
  try {
    return raw.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  } catch {
    return raw.toLowerCase();
  }
}

/** Infere modo de trabalho a partir do texto da vaga (a API não tem campo dedicado). */
export function inferWorkMode(job: CodanteJob): WorkMode {
  const t = `${job.title} ${job.description} ${job.requirements} ${job.city}`.toLowerCase();
  const hasRemote = /\b(remoto|remote|teletrabalho|home\s*office|wfh|100\s*%\s*remoto|totalmente\s+remoto)\b/i.test(
    t,
  );
  const hasHybrid = /\b(h[íi]brido|hybrid)\b/i.test(t);
  const hasOnsite = /\b(presencial|on-?site|no\s+escrit[óo]rio|escrit[óo]rio(\s+central)?)\b/i.test(t);

  if (hasHybrid) return 'hybrid';
  if (hasRemote && hasOnsite) return 'hybrid';
  if (hasRemote) return 'remote';
  if (hasOnsite) return 'onsite';
  return 'unknown';
}

export function matchesScheduleCategory(job: CodanteJob, category: ScheduleCategory): boolean {
  if (category === 'all') return true;
  const s = (job.schedule || '').toLowerCase();
  if (category === 'internship') return s === 'internship';
  if (category === 'employment') return s !== 'internship';
  return true;
}

export function matchesWorkModeFilter(job: CodanteJob, filter: WorkModeFilter): boolean {
  if (filter === 'all') return true;
  const m = inferWorkMode(job);
  if (filter === 'remote') return m === 'remote' || m === 'hybrid';
  if (filter === 'hybrid') return m === 'hybrid';
  if (filter === 'onsite') return m === 'onsite' || m === 'unknown';
  return true;
}

/** A vaga menciona todas as habilidades selecionadas (E lógico). */
export function matchesSelectedSkills(job: CodanteJob, skillIds: readonly string[]): boolean {
  if (skillIds.length === 0) return true;
  const text = jobTextForMatching(job);
  return skillIds.every((id) => {
    const re = SKILL_PATTERNS[id];
    return re ? re.test(text) : false;
  });
}

export function filterJobs(
  jobs: CodanteJob[],
  scheduleCategory: ScheduleCategory,
  workMode: WorkModeFilter,
  selectedSkillIds: readonly string[],
): CodanteJob[] {
  return jobs.filter(
    (j) =>
      matchesScheduleCategory(j, scheduleCategory) &&
      matchesWorkModeFilter(j, workMode) &&
      matchesSelectedSkills(j, selectedSkillIds),
  );
}
