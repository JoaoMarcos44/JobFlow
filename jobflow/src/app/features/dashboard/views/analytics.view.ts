import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
  inject,
  afterNextRender,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables, type ChartConfiguration } from 'chart.js';
import { animateElementsFrom, createDashboardViewStagger } from '../dashboard.animations';

Chart.register(...registerables);

type AnalyticsPeriod = 'week' | 'month';

@Component({
  selector: 'app-analytics-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.view.html',
  styleUrls: ['./analytics.view.scss'],
})
export class AnalyticsViewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chartEnviados') chartEnviadosRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartRecebidos') chartRecebidosRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartResultados') chartResultadosRef!: ElementRef<HTMLCanvasElement>;

  private readonly host = inject(ElementRef<HTMLElement>);
  private viewCtx?: ReturnType<typeof createDashboardViewStagger>;

  private get viewRoot(): HTMLElement {
    return (
      (this.host.nativeElement.querySelector('.analytics-view') as HTMLElement) ??
      this.host.nativeElement
    );
  }

  readonly period = signal<AnalyticsPeriod>('week');
  readonly refreshing = signal(false);
  readonly liveDemo = signal(false);

  /** Soma dos valores do gráfico de barras (atualizado em sync) */
  private readonly enviadosSum = signal(24);
  readonly totalEnviados = computed(() => this.enviadosSum());

  private readonly recebidosLabel = signal('100%');
  readonly totalRecebidos = computed(() => this.recebidosLabel());

  private readonly resultadosLabel = signal('—');
  readonly totalResultados = computed(() => this.resultadosLabel());

  private charts: Chart[] = [];
  private barChart?: Chart;
  private doughnutChart?: Chart;
  private lineChart?: Chart;
  private liveTimer: ReturnType<typeof setInterval> | null = null;

  private readonly reduceMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor() {
    afterNextRender(() => {
      requestAnimationFrame(() => {
        this.viewCtx = createDashboardViewStagger(this.viewRoot);
        queueMicrotask(() =>
          animateElementsFrom(this.viewRoot, '.analytics-card', {
            y: 20,
            opacity: 0,
            duration: 0.42,
            stagger: 0.08,
            ease: 'power3.out',
          }),
        );
      });
    });
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.initCharts());
  }

  ngOnDestroy(): void {
    this.stopLiveDemo();
    this.viewCtx?.revert();
    this.charts.forEach((c) => c.destroy());
    this.charts = [];
    this.barChart = this.doughnutChart = this.lineChart = undefined;
  }

  setPeriod(p: AnalyticsPeriod): void {
    if (this.period() === p) return;
    this.period.set(p);
    this.syncAllCharts(true);
  }

  refreshCharts(opts?: { silent?: boolean }): void {
    const silent = opts?.silent === true;
    if (!silent) {
      if (this.refreshing()) return;
      this.refreshing.set(true);
    }
    const jitter = (n: number, maxDelta = 2) =>
      Math.max(0, n + Math.floor(Math.random() * (maxDelta * 2 + 1)) - maxDelta);

    const done = () => {
      if (!silent) this.refreshing.set(false);
    };

    window.setTimeout(() => {
      if (this.barChart?.data.datasets[0]?.data) {
        const d = this.barChart.data.datasets[0].data as number[];
        this.barChart.data.datasets[0].data = d.map((v) => jitter(v, 1));
      }
      if (this.doughnutChart?.data.datasets[0]?.data) {
        const d = this.doughnutChart.data.datasets[0].data as number[];
        const next = d.map((v) => Math.max(5, jitter(v, 4)));
        const sum = next.reduce((a, b) => a + b, 0);
        this.doughnutChart.data.datasets[0].data = next;
        this.recebidosLabel.set(`${sum > 0 ? 100 : 0}%`);
      }
      if (this.lineChart?.data.datasets) {
        for (const ds of this.lineChart.data.datasets) {
          const d = ds.data as number[];
          ds.data = d.map((v) => jitter(v, 1));
        }
      }
      this.updateKpisFromCharts();
      this.charts.forEach((c) => c.update(this.reduceMotion ? 'none' : 'active'));
      done();
    }, silent || this.reduceMotion ? 0 : 380);
  }

  toggleLiveDemo(): void {
    if (this.liveDemo()) {
      this.stopLiveDemo();
      return;
    }
    if (this.reduceMotion) return;
    this.liveDemo.set(true);
    this.liveTimer = setInterval(() => this.refreshCharts({ silent: true }), 9000);
  }

  private stopLiveDemo(): void {
    this.liveDemo.set(false);
    if (this.liveTimer) {
      clearInterval(this.liveTimer);
      this.liveTimer = null;
    }
  }

  private anim(): false | { duration: number; easing: 'easeOutQuart' } {
    if (this.reduceMotion) return false;
    return { duration: 950, easing: 'easeOutQuart' };
  }

  private basePlugins() {
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

  private barConfig(): ChartConfiguration<'bar'> {
    const isWeek = this.period() === 'week';
    const labels = isWeek
      ? ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
      : ['S1', 'S2', 'S3', 'S4', 'S5'];
    const data = isWeek ? [3, 5, 4, 6, 2, 3, 1] : [11, 14, 18, 15, 12];
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
        animation: this.anim(),
        interaction: { mode: 'index', intersect: false },
        plugins: { ...this.basePlugins(), legend: { display: false } },
        scales: {
          x: {
            grid: { color: 'rgba(51, 65, 85, 0.35)' },
            ticks: { color: '#94a3b8' },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(51, 65, 85, 0.35)' },
            ticks: { color: '#94a3b8' },
          },
        },
      },
    };
  }

  private doughnutConfig(): ChartConfiguration<'doughnut'> {
    const isWeek = this.period() === 'week';
    const data = isWeek ? [40, 35, 25] : [38, 32, 30];
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
        animation: this.anim(),
        cutout: '62%',
        plugins: this.basePlugins(),
      },
    };
  }

  private lineConfig(): ChartConfiguration<'line'> {
    const isWeek = this.period() === 'week';
    const labels = isWeek
      ? ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6']
      : ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8'];
    const entrevistas = isWeek ? [2, 4, 3, 6, 5, 7] : [3, 5, 4, 7, 6, 8, 7, 9];
    const propostas = isWeek ? [0, 1, 2, 2, 4, 3] : [1, 1, 2, 3, 3, 4, 4, 5];
    const contratacoes = isWeek ? [0, 0, 1, 1, 1, 2] : [0, 1, 1, 1, 2, 2, 2, 3];
    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Entrevistas',
            data: entrevistas,
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.12)',
            fill: true,
            tension: 0.42,
            pointRadius: 4,
            pointHoverRadius: 9,
            pointBackgroundColor: '#06b6d4',
            pointBorderColor: '#cffafe',
            pointBorderWidth: 2,
            pointHoverBorderWidth: 3,
          },
          {
            label: 'Propostas',
            data: propostas,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            fill: true,
            tension: 0.42,
            pointRadius: 4,
            pointHoverRadius: 9,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#d1fae5',
            pointBorderWidth: 2,
          },
          {
            label: 'Contratações',
            data: contratacoes,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            fill: true,
            tension: 0.42,
            pointRadius: 4,
            pointHoverRadius: 9,
            pointBackgroundColor: '#f59e0b',
            pointBorderColor: '#fef3c7',
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: this.anim(),
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        plugins: this.basePlugins(),
        scales: {
          x: {
            grid: { color: 'rgba(51, 65, 85, 0.25)' },
            ticks: { color: '#94a3b8' },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(51, 65, 85, 0.35)' },
            ticks: { color: '#94a3b8' },
          },
        },
      },
    };
  }

  private initCharts(): void {
    this.charts.forEach((c) => c.destroy());
    this.charts = [];

    const env = this.chartEnviadosRef?.nativeElement;
    if (env) {
      this.barChart = new Chart(env.getContext('2d')!, this.barConfig());
      this.charts.push(this.barChart as Chart);
    }

    const rec = this.chartRecebidosRef?.nativeElement;
    if (rec) {
      this.doughnutChart = new Chart(rec.getContext('2d')!, this.doughnutConfig());
      this.charts.push(this.doughnutChart as Chart);
    }

    const res = this.chartResultadosRef?.nativeElement;
    if (res) {
      this.lineChart = new Chart(res.getContext('2d')!, this.lineConfig());
      this.charts.push(this.lineChart as Chart);
    }

    this.updateKpisFromCharts();
  }

  private syncAllCharts(animate: boolean): void {
    if (!this.barChart || !this.doughnutChart || !this.lineChart) return;

    const b = this.barConfig();
    this.barChart.data.labels = b.data.labels as string[];
    this.barChart.data.datasets[0].data = [...(b.data.datasets![0].data as number[])];

    const d = this.doughnutConfig();
    this.doughnutChart.data.datasets[0].data = [...(d.data.datasets![0].data as number[])];

    const l = this.lineConfig();
    this.lineChart.data.labels = l.data.labels as string[];
    l.data.datasets!.forEach((ds, i) => {
      (this.lineChart!.data.datasets[i].data as number[]) = [...(ds.data as number[])];
    });

    this.updateKpisFromCharts();
    const mode = animate && !this.reduceMotion ? 'active' : 'none';
    this.charts.forEach((c) => c.update(mode));
  }

  private updateKpisFromCharts(): void {
    const bar = this.barChart?.data.datasets[0]?.data as number[] | undefined;
    if (bar?.length) {
      this.enviadosSum.set(bar.reduce((a, b) => a + b, 0));
    }

    const dough = this.doughnutChart?.data.datasets[0]?.data as number[] | undefined;
    if (dough?.length) {
      const sum = dough.reduce((a, b) => a + b, 0);
      this.recebidosLabel.set(sum > 0 ? '100%' : '0%');
    }

    const lineDs = this.lineChart?.data.datasets[0]?.data as number[] | undefined;
    if (lineDs && lineDs.length >= 2) {
      const last = lineDs[lineDs.length - 1] ?? 0;
      const prev = lineDs[lineDs.length - 2] ?? 0;
      const delta = last - prev;
      const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
      this.resultadosLabel.set(`${arrow} Entrevistas: ${last} (vs ${prev})`);
    } else {
      this.resultadosLabel.set('—');
    }
  }
}
