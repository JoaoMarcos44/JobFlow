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

  private barChart?: Chart;
  private doughnutChart?: Chart;
  private lineChart?: Chart;
  private liveTimer: ReturnType<typeof setInterval> | null = null;

  private get allCharts(): Chart[] {
    return [this.barChart, this.doughnutChart, this.lineChart].filter(Boolean) as Chart[];
  }

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
    this.allCharts.forEach((chart) => chart.destroy());
    this.barChart = this.doughnutChart = this.lineChart = undefined;
  }

  setPeriod(period: AnalyticsPeriod): void {
    if (this.period() === period) return;
    this.period.set(period);
    this.syncAllCharts(true);
  }

  refreshCharts(options?: { silent?: boolean }): void {
    const silent = options?.silent === true;
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
      this.allCharts.forEach((chart) => chart.update(this.reduceMotion ? 'none' : 'active'));
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
      this.barChart.data.datasets[0].data = values.map((value) => jitterValue(value, 1));
    }
    if (this.doughnutChart?.data.datasets[0]?.data) {
      const values = this.doughnutChart.data.datasets[0].data as number[];
      const next = values.map((value) => Math.max(5, jitterValue(value, 4)));
      const sum = next.reduce((total, value) => total + value, 0);
      this.doughnutChart.data.datasets[0].data = next;
      this.recebidosLabel.set(`${sum > 0 ? 100 : 0}%`);
    }
    if (this.lineChart?.data.datasets) {
      for (const dataset of this.lineChart.data.datasets) {
        const values = dataset.data as number[];
        dataset.data = values.map((value) => jitterValue(value, 1));
      }
    }
  }

  private initCharts(): void {
    this.allCharts.forEach((chart) => chart.destroy());
    this.barChart = this.doughnutChart = this.lineChart = undefined;

    const sentCanvas = this.chartEnviadosRef?.nativeElement;
    if (sentCanvas) this.barChart = new Chart(sentCanvas.getContext('2d')!, this.barConfig());

    const sourcesCanvas = this.chartRecebidosRef?.nativeElement;
    if (sourcesCanvas) this.doughnutChart = new Chart(sourcesCanvas.getContext('2d')!, this.doughnutConfig());

    const outcomesCanvas = this.chartResultadosRef?.nativeElement;
    if (outcomesCanvas) this.lineChart = new Chart(outcomesCanvas.getContext('2d')!, this.lineConfig());

    this.updateKpisFromCharts();
  }

  private syncAllCharts(animate: boolean): void {
    if (!this.barChart || !this.doughnutChart || !this.lineChart) return;

    const barConfig = this.barConfig();
    this.barChart.data.labels = barConfig.data.labels as string[];
    this.barChart.data.datasets[0].data = [...(barConfig.data.datasets![0].data as number[])];

    const doughnutConfig = this.doughnutConfig();
    this.doughnutChart.data.datasets[0].data = [...(doughnutConfig.data.datasets![0].data as number[])];

    const lineConfig = this.lineConfig();
    this.lineChart.data.labels = lineConfig.data.labels as string[];
    lineConfig.data.datasets!.forEach((dataset, index) => {
      (this.lineChart!.data.datasets[index].data as number[]) = [...(dataset.data as number[])];
    });

    this.updateKpisFromCharts();
    const mode = animate && !this.reduceMotion ? 'active' : 'none';
    this.allCharts.forEach((chart) => chart.update(mode));
  }

  private updateKpisFromCharts(): void {
    const barValues = this.barChart?.data.datasets[0]?.data as number[] | undefined;
    if (barValues?.length) {
      this.enviadosSum.set(barValues.reduce((sum, value) => sum + value, 0));
    }

    const doughnutValues = this.doughnutChart?.data.datasets[0]?.data as number[] | undefined;
    if (doughnutValues?.length) {
      const sum = doughnutValues.reduce((total, value) => total + value, 0);
      this.recebidosLabel.set(sum > 0 ? '100%' : '0%');
    }

    const lineValues = this.lineChart?.data.datasets[0]?.data as number[] | undefined;
    if (lineValues && lineValues.length >= 2) {
      const last = lineValues[lineValues.length - 1] ?? 0;
      const prev = lineValues[lineValues.length - 2] ?? 0;
      const delta = last - prev;
      const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
      this.resultadosLabel.set(`${arrow} Entrevistas: ${last} (vs ${prev})`);
    } else {
      this.resultadosLabel.set('—');
    }
  }
}
