import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

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

  totalEnviados = 24;
  totalRecebidos = '100%';
  totalResultados = '—';

  private charts: Chart[] = [];

  ngAfterViewInit(): void {
    this.initCharts();
  }

  ngOnDestroy(): void {
    this.charts.forEach((c) => c.destroy());
    this.charts = [];
  }

  private initCharts(): void {
    this.charts.forEach((c) => c.destroy());
    this.charts = [];

    const env = this.chartEnviadosRef?.nativeElement;
    if (env) {
      const c1 = new Chart(env.getContext('2d')!, {
        type: 'bar',
        data: {
          labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
          datasets: [
            {
              label: 'Enviados',
              data: [3, 5, 4, 6, 2, 3, 1],
              backgroundColor: 'rgba(6, 182, 212, 0.7)',
              borderColor: '#06b6d4',
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
      });
      this.charts.push(c1);
    }

    const rec = this.chartRecebidosRef?.nativeElement;
    if (rec) {
      const c2 = new Chart(rec.getContext('2d')!, {
        type: 'doughnut',
        data: {
          labels: ['Site', 'Indicação', 'LinkedIn'],
          datasets: [
            {
              data: [40, 35, 25],
              backgroundColor: ['#06b6d4', '#10b981', '#f59e0b'],
              borderWidth: 0,
            },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false },
      });
      this.charts.push(c2);
    }

    const res = this.chartResultadosRef?.nativeElement;
    if (res) {
      const c3 = new Chart(res.getContext('2d')!, {
        type: 'line',
        data: {
          labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
          datasets: [
            {
              label: 'Entrevistas',
              data: [2, 4, 3, 6, 5, 7],
              borderColor: '#06b6d4',
              backgroundColor: 'rgba(6, 182, 212, 0.1)',
              fill: true,
              tension: 0.3,
            },
            {
              label: 'Propostas',
              data: [0, 1, 2, 2, 4, 3],
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: true,
              tension: 0.3,
            },
            {
              label: 'Contratações',
              data: [0, 0, 1, 1, 1, 2],
              borderColor: '#f59e0b',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              fill: true,
              tension: 0.3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true } },
        },
      });
      this.charts.push(c3);
    }
  }
}
