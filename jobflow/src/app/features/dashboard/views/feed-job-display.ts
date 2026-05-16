import type { CodanteJob } from '../../../core/services/job-board.service';

const SCHEDULE_LABELS: Record<string, string> = {
  'full-time': 'Tempo integral',
  'part-time': 'Meio período',
  contract: 'Contrato',
  internship: 'Estágio',
};

export function companyInitial(company: string): string {
  return (company?.trim().charAt(0) || '?').toUpperCase();
}

export function tagsFromJob(job: CodanteJob): string[] {
  const text = (job.requirements || job.description || '').replace(/\n/g, ' ');
  const words = text.split(/[\s,;()-]+/).filter((w) => w.length > 2 && /^[A-Za-z#]+$/.test(w));
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const word of words) {
    const label = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    if (seen.has(label) || tags.length >= 4) break;
    seen.add(label);
    tags.push(label);
  }
  return tags.slice(0, 4);
}

export function shortenText(text: string, maxLen = 120): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.slice(0, maxLen).trim() + '…';
}

export function scheduleLabel(schedule: string): string {
  return SCHEDULE_LABELS[schedule] ?? schedule;
}
