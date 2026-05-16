import type { ChartConfiguration } from 'chart.js';

export type AnalyticsPeriod = 'week' | 'month';

export type ChartMotion = false | { duration: number; easing: 'easeOutQuart' };

export function chartMotion(reduceMotion: boolean): ChartMotion {
  if (reduceMotion) return false;
  return { duration: 950, easing: 'easeOutQuart' };
}

export function chartTooltipPlugins() {
  return {
    legend: {
      labels: { color: '#94a3b8', font: { size: 11 } },
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.94)',
      titleColor: '#f8fafc',
      bodyColor: '#e2e8f0',
      padding: 12,
      cornerRadius: 10,
      displayColors: true,
      borderColor: 'rgba(51, 65, 85, 0.8)',
      borderWidth: 1,
    },
  };
}

const axisGrid = { color: 'rgba(51, 65, 85, 0.35)' };
const axisTicks = { color: '#94a3b8' };

export function buildBarChartConfig(period: AnalyticsPeriod, motion: ChartMotion): ChartConfiguration<'bar'> {
  const week = period === 'week';
  const labels = week ? ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] : ['S1', 'S2', 'S3', 'S4', 'S5'];
  const data = week ? [3, 5, 4, 6, 2, 3, 1] : [11, 14, 18, 15, 12];
  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Enviados',
          data,
          backgroundColor: [
            'rgba(6, 182, 212, 0.55)',
            'rgba(6, 182, 212, 0.82)',
            'rgba(6, 182, 212, 0.68)',
            'rgba(6, 182, 212, 0.88)',
            'rgba(6, 182, 212, 0.62)',
            'rgba(6, 182, 212, 0.75)',
            'rgba(6, 182, 212, 0.58)',
            'rgba(6, 182, 212, 0.8)',
            'rgba(6, 182, 212, 0.72)',
          ],
          borderColor: '#06b6d4',
          borderWidth: 1,
          borderRadius: 6,
          hoverBackgroundColor: 'rgba(34, 211, 238, 0.92)',
          hoverBorderColor: '#a5f3fc',
          hoverBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: motion,
      interaction: { mode: 'index', intersect: false },
      plugins: { ...chartTooltipPlugins(), legend: { display: false } },
      scales: {
        x: { grid: axisGrid, ticks: axisTicks },
        y: { beginAtZero: true, grid: axisGrid, ticks: axisTicks },
      },
    },
  };
}

export function buildDoughnutChartConfig(
  period: AnalyticsPeriod,
  motion: ChartMotion,
): ChartConfiguration<'doughnut'> {
  const week = period === 'week';
  const data = week ? [40, 35, 25] : [38, 32, 30];
  return {
    type: 'doughnut',
    data: {
      labels: ['Site', 'Indicação', 'LinkedIn'],
      datasets: [
        {
          data,
          backgroundColor: ['#06b6d4', '#10b981', '#f59e0b'],
          hoverBackgroundColor: ['#22d3ee', '#34d399', '#fbbf24'],
          borderWidth: 0,
          hoverOffset: 14,
          offset: [4, 0, 0],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: motion,
      cutout: '62%',
      plugins: chartTooltipPlugins(),
    },
  };
}

export function buildLineChartConfig(period: AnalyticsPeriod, motion: ChartMotion): ChartConfiguration<'line'> {
  const week = period === 'week';
  const labels = week
    ? ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6']
    : ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8'];
  const entrevistas = week ? [2, 4, 3, 6, 5, 7] : [3, 5, 4, 7, 6, 8, 7, 9];
  const propostas = week ? [0, 1, 2, 2, 4, 3] : [1, 1, 2, 3, 3, 4, 4, 5];
  const contratacoes = week ? [0, 0, 1, 1, 1, 2] : [0, 1, 1, 1, 2, 2, 2, 3];
  const lineDataset = (
    label: string,
    data: number[],
    color: string,
    fill: string,
    pointBorder: string,
  ) => ({
    label,
    data,
    borderColor: color,
    backgroundColor: fill,
    fill: true,
    tension: 0.42,
    pointRadius: 4,
    pointHoverRadius: 9,
    pointBackgroundColor: color,
    pointBorderColor: pointBorder,
    pointBorderWidth: 2,
    pointHoverBorderWidth: 3,
  });

  return {
    type: 'line',
    data: {
      labels,
      datasets: [
        lineDataset('Entrevistas', entrevistas, '#06b6d4', 'rgba(6, 182, 212, 0.12)', '#cffafe'),
        lineDataset('Propostas', propostas, '#10b981', 'rgba(16, 185, 129, 0.12)', '#d1fae5'),
        lineDataset('Contratações', contratacoes, '#f59e0b', 'rgba(245, 158, 11, 0.12)', '#fef3c7'),
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: motion,
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      plugins: chartTooltipPlugins(),
      scales: {
        x: { grid: { color: 'rgba(51, 65, 85, 0.25)' }, ticks: axisTicks },
        y: { beginAtZero: true, grid: axisGrid, ticks: axisTicks },
      },
    },
  };
}

/** Pequena variação aleatória para o modo demo/refresh (comportamento igual ao anterior). */
export function jitterValue(value: number, maxDelta = 2): number {
  return Math.max(0, value + Math.floor(Math.random() * (maxDelta * 2 + 1)) - maxDelta);
}
