import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { HighchartsChartComponent } from 'highcharts-angular';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-analitica-page',
  imports: [CommonModule, HighchartsChartComponent],
  template: `
    <div class="analytics-page">
      <h1 class="page-title">Analitica</h1>
      <p class="page-subtitle">Resumen visual de ingresos, salidas y comportamiento transaccional.</p>

      <div class="loading" *ngIf="loading()">Cargando analitica...</div>

      <div *ngIf="!loading()" class="content">
        <div class="stats-grid">
          <div class="stat-card">
            <span>Ingresos</span>
            <strong>S/ {{ resumen()?.totales?.ingresosSoles | number:'1.2-2' }}</strong>
          </div>
          <div class="stat-card">
            <span>Salidas</span>
            <strong>S/ {{ resumen()?.totales?.salidasSoles | number:'1.2-2' }}</strong>
          </div>
          <div class="stat-card">
            <span>Movimientos</span>
            <strong>{{ resumen()?.totales?.totalTransacciones || 0 }}</strong>
          </div>
        </div>

        <div class="chart-grid">
          <section class="panel">
            <highcharts-chart
              [options]="dailyOptions()"
              style="width: 100%; height: 320px; display: block;"
            ></highcharts-chart>
          </section>

          <section class="panel">
            <highcharts-chart
              [options]="typeOptions()"
              style="width: 100%; height: 320px; display: block;"
            ></highcharts-chart>
          </section>
        </div>

        <section class="panel">
          <h2>Contrapartes frecuentes</h2>
          <div class="rows">
            <div class="row" *ngFor="let item of resumen()?.topContrapartes || []">
              <span>{{ item.nombre }}</span>
              <strong>S/ {{ item.montoSoles | number:'1.2-2' }}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .analytics-page { max-width: 1120px; animation: fadeIn 0.4s ease; }
    .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
    .page-subtitle { color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem; }
    .loading { padding: 1rem; background: var(--info-bg); color: var(--info); border-radius: var(--radius-md); }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    .stat-card, .panel { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1rem; }
    .stat-card { display: flex; flex-direction: column; gap: 0.25rem; }
    .stat-card span { color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase; }
    .stat-card strong { font-size: 1.35rem; color: var(--text-primary); }
    .chart-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .panel h2 { font-size: 1rem; margin-bottom: 0.75rem; }
    .rows { display: grid; gap: 0.5rem; }
    .row { display: flex; justify-content: space-between; gap: 1rem; padding: 0.65rem; background: var(--bg-input); border-radius: var(--radius-sm); }
    .row span { color: var(--text-secondary); }
    @media (max-width: 900px) { .chart-grid { grid-template-columns: 1fr; } }
  `]
})
export class AnaliticaPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  protected loading = signal(true);
  protected resumen = signal<any>(null);
  protected dailyOptions = signal<any>({});
  protected typeOptions = signal<any>({});

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiBaseUrl}/analitica/resumen`, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (data) => {
        this.resumen.set(data);
        this.dailyOptions.set(this.buildDailyOptions(data));
        this.typeOptions.set(this.buildTypeOptions(data));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private baseChart(title: string): any {
    return {
      chart: { backgroundColor: '#231d30', style: { fontFamily: 'Inter, sans-serif' } },
      title: { text: title, style: { color: '#f1eef8' } },
      credits: { enabled: false },
      legend: { itemStyle: { color: '#a8a0b8' } },
      xAxis: { labels: { style: { color: '#a8a0b8' } }, lineColor: 'rgba(255,255,255,.15)' },
      yAxis: { title: { text: 'Soles', style: { color: '#a8a0b8' } }, labels: { style: { color: '#a8a0b8' } }, gridLineColor: 'rgba(255,255,255,.08)' }
    };
  }

  private buildDailyOptions(data: any): any {
    return {
      ...this.baseChart('Ingresos vs salidas'),
      xAxis: { ...this.baseChart('').xAxis, categories: data.porDia.map((x: any) => x.fecha) },
      series: [
        { type: 'line', name: 'Ingresos', data: data.porDia.map((x: any) => x.ingresosSoles), color: '#22c55e' },
        { type: 'line', name: 'Salidas', data: data.porDia.map((x: any) => x.salidasSoles), color: '#ef4444' }
      ]
    };
  }

  private buildTypeOptions(data: any): any {
    return {
      chart: { type: 'pie', backgroundColor: '#231d30', style: { fontFamily: 'Inter, sans-serif' } },
      title: { text: 'Monto por tipo', style: { color: '#f1eef8' } },
      credits: { enabled: false },
      legend: { itemStyle: { color: '#a8a0b8' } },
      plotOptions: { pie: { dataLabels: { style: { color: '#f1eef8', textOutline: 'none' } } } },
      series: [{
        type: 'pie',
        name: 'Soles',
        data: data.porTipo.map((x: any) => ({ name: x.tipo, y: x.montoSoles }))
      }]
    };
  }
}
