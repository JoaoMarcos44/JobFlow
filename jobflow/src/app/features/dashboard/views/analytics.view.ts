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
import { mountDashboardView, viewRoot } from '../dashboard-view-host';
import {
  type AnalyticsPeriod,
  buildBarChartConfig,
  buildDoughnutChartConfig,
  buildLineChartConfig,
  chartMotion,
  jitterValue,
} from './analytics-chart.config';

Chart.register(...registerables);

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
  private entranceAnimation?: ReturnType<typeof mountDashboardView>;

  readonly period = signal<AnalyticsPeriod>('week');
  readonly refreshing = signal(false);
  readonly liveDemo = signal(false);

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
        const root = viewRoot(this.host.nativeElement, '.analytics-view');
        this.entranceAnimation = mountDashboardView(root, {
          selector: '.analytics-card',
          vars: { y: 20, opacity: 0, duration: 0.42, stagger: 0.08, ease: 'power3.out' },
        });
      });
    });
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.initCharts());
  }

  ngOnDestroy(): void {
    this.stopLiveDemo();
    this.entranceAnimation?.revert();
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

    const done = () => {
      if (!silent) this.refreshing.set(false);
    };

    window.setTimeout(() => {
      this.applyRefreshJitter();
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

  private motion() {
    return chartMotion(this.reduceMotion);
  }

  private barConfig(): ChartConfiguration<'bar'> {
    return buildBarChartConfig(this.period(), this.motion());
  }

  private doughnutConfig(): ChartConfiguration<'doughnut'> {
    return buildDoughnutChartConfig(this.period(), this.motion());
  }

  private lineConfig(): ChartConfiguration<'line'> {
    return buildLineChartConfig(this.period(), this.motion());
  }

  private applyRefreshJitter(): void {
    if (this.barChart?.data.datasets[0]?.data) {
      const values = this.barChart.data.datasets[0].data as number[];
      this.barChart.data.datasets[0].data = values.map((v) => jitterValue(v, 1));
    }
    if (this.doughnutChart?.data.datasets[0]?.data) {
      const values = this.doughnutChart.data.datasets[0].data as number[];
      const next = values.map((v) => Math.max(5, jitterValue(v, 4)));
      const sum = next.reduce((a, b) => a + b, 0);
      this.doughnutChart.data.datasets[0].data = next;
      this.recebidosLabel.set(`${sum > 0 ? 100 : 0}%`);
    }
    if (this.lineChart?.data.datasets) {
      for (const ds of this.lineChart.data.datasets) {
        const values = ds.data as number[];
        ds.data = values.map((v) => jitterValue(v, 1));
      }
    }
  }

  private initCharts(): void {
    this.charts.forEach((c) => c.destroy());
    this.charts = [];

    const sentCanvas = this.chartEnviadosRef?.nativeElement;
    if (sentCanvas) {
      this.barChart = new Chart(sentCanvas.getContext('2d')!, this.barConfig());
      this.charts.push(this.barChart as Chart);
    }

    const sourcesCanvas = this.chartRecebidosRef?.nativeElement;
    if (sourcesCanvas) {
      this.doughnutChart = new Chart(sourcesCanvas.getContext('2d')!, this.doughnutConfig());
      this.charts.push(this.doughnutChart as Chart);
    }

    const outcomesCanvas = this.chartResultadosRef?.nativeElement;
    if (outcomesCanvas) {
      this.lineChart = new Chart(outcomesCanvas.getContext('2d')!, this.lineConfig());
      this.charts.push(this.lineChart as Chart);
    }

    this.updateKpisFromCharts();
  }

  private syncAllCharts(animate: boolean): void {
    if (!this.barChart || !this.doughnutChart || !this.lineChart) return;

    const bar = this.barConfig();
    this.barChart.data.labels = bar.data.labels as string[];
    this.barChart.data.datasets[0].data = [...(bar.data.datasets![0].data as number[])];

    const dough = this.doughnutConfig();
    this.doughnutChart.data.datasets[0].data = [...(dough.data.datasets![0].data as number[])];

    const line = this.lineConfig();
    this.lineChart.data.labels = line.data.labels as string[];
    line.data.datasets!.forEach((ds, i) => {
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
