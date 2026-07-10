import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HighchartsChartComponent } from 'highcharts-angular';
import type { Options as HighchartsOptions } from 'highcharts';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

type CommercePeriod = 'DIARIO' | 'MENSUAL' | 'ANUAL';

interface AnaliticaMovimiento {
  id: string;
  tipo: string;
  estado: string;
  montoCentavos: number;
  montoSoles: number;
  createdAt: string;
  tipoQr: 'FIJO' | 'ABIERTO' | null;
  tipoMovimiento: 'SALIDA' | 'INGRESO';
  comercioCategoria: string | null;
  comercioNombre: string | null;
  contraparteNombre: string | null;
}

interface AnaliticaResumen {
  totales: {
    ingresosSoles: number;
    salidasSoles: number;
    balanceNetoSoles: number;
    balanceNetoCentavos: number;
    totalTransacciones: number;
  };
  porDia: Array<{
    fecha: string;
    ingresosSoles: number;
    salidasSoles: number;
  }>;
  porCategoriaGastos: Array<{
    categoria: string;
    montoSoles: number;
  }>;
  historicoMensual: Array<{
    mes: string;
    ingresosSoles: number;
    salidasSoles: number;
  }>;
  insights: {
    diaMayorGasto: {
      dia: string;
      montoSoles: number;
    } | null;
    mayorGastoMes: {
      tipo: string;
      contraparteNombre: string;
      montoSoles: number;
    } | null;
  };
  movimientos: AnaliticaMovimiento[];
  topContrapartes: Array<{
    nombre: string;
    cantidad: number;
    montoSoles: number;
  }>;
}

interface MetricCard {
  label: string;
  value: string;
  tone: 'emerald' | 'rose' | 'amber' | 'slate';
}

interface InsightCard {
  title: string;
  text: string;
}

interface MayorGastoReal {
  tipo: string;
  contraparteNombre: string | null;
  comercioNombre?: string | null;
  montoSoles: number;
}

interface CommercePeriodTab {
  value: CommercePeriod;
  label: string;
}

interface CommercePerformanceRow {
  name: string;
  totalSoles: number;
  transactions: number;
}

interface KPIGroup {
  title: string;
  description: string;
  labels: string[];
}

interface CommerceSplitRow {
  label: string;
  totalSoles: number;
}

@Component({
  standalone: true,
  selector: 'app-analitica-page',
  imports: [CommonModule, HighchartsChartComponent],
  templateUrl: './analitica.page.html',
  styles: [`
    .analitica-page {
      max-width: 1120px;
      animation: fadeIn 0.4s ease;
    }

    .page-hero {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .eyebrow {
      font-size: 0.78rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--primary-300);
      margin-bottom: 0.35rem;
      font-weight: 700;
    }

    .page-title {
      font-size: 1.8rem;
      font-weight: 700;
      line-height: 1.1;
      margin-bottom: 0.35rem;
    }

    .page-subtitle {
      color: var(--text-secondary);
      font-size: 0.94rem;
      max-width: 56rem;
    }

    .toggle-advanced-btn {
      border: 1px solid var(--border-default);
      background: linear-gradient(135deg, rgba(255, 178, 0, 0.14), rgba(255, 178, 0, 0.06));
      color: var(--text-primary);
      border-radius: var(--radius-full);
      padding: 0.65rem 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
      white-space: nowrap;
    }

    .toggle-advanced-btn:hover {
      border-color: rgba(255, 178, 0, 0.35);
      transform: translateY(-1px);
    }

    .loading,
    .panel,
    .stat-card,
    .commerce-card,
    .insight-card,
    .empty-state {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }

    .loading {
      padding: 1rem;
      color: var(--info);
      background: var(--info-bg);
      margin-bottom: 1rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .stat-card {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      min-height: 112px;
      justify-content: space-between;
    }

    .stat-card span {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
    }

    .stat-card strong {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .metric-emerald { color: var(--success); }
    .metric-rose { color: var(--error); }
    .metric-amber { color: var(--warning); }
    .metric-slate { color: var(--text-primary); }

    .panel {
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .panel-header h2 {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .panel-header p {
      color: var(--text-secondary);
      font-size: 0.84rem;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .chart-box {
      height: 340px;
      width: 100%;
    }

    .chart-box-lg {
      height: 360px;
    }

    .chart-box-xl {
      height: 420px;
    }

    .chart {
      display: block;
      width: 100%;
      height: 100%;
    }

    .advanced-header {
      align-items: center;
    }

    .tabs {
      display: inline-flex;
      padding: 0.25rem;
      border-radius: var(--radius-full);
      background: var(--bg-input);
      border: 1px solid var(--border-subtle);
      gap: 0.25rem;
      flex-wrap: wrap;
    }

    .tab-btn {
      border: none;
      background: transparent;
      color: var(--text-secondary);
      border-radius: var(--radius-full);
      padding: 0.6rem 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .tab-btn:hover {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.04);
    }

    .tab-btn.active {
      background: var(--primary-500);
      color: #000000;
    }

    .commerce-grid,
    .insights-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }

    .commerce-card,
    .insight-card {
      padding: 1rem;
    }

    .commerce-card {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .rank {
      color: var(--text-muted);
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .commerce-card h3 {
      font-size: 1rem;
      font-weight: 700;
    }

    .commerce-card p {
      color: var(--text-secondary);
      font-size: 0.84rem;
    }

    .commerce-card strong {
      color: var(--success);
      font-size: 1.15rem;
      font-weight: 700;
    }

    .insight-card {
      background: linear-gradient(135deg, rgba(255, 178, 0, 0.08), rgba(59, 130, 246, 0.05));
    }

    .insight-card span {
      display: inline-block;
      margin-bottom: 0.4rem;
      color: var(--primary-300);
      text-transform: uppercase;
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      font-weight: 700;
    }

    .insight-card p {
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .rows {
      display: grid;
      gap: 0.6rem;
    }

    .row {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.8rem 0.9rem;
      background: var(--bg-input);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
    }

    .row span {
      color: var(--text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .empty-state {
      padding: 1rem;
      text-align: center;
      color: var(--text-secondary);
      background: var(--bg-input);
    }

    @media (max-width: 960px) {
      .page-hero,
      .panel-header,
      .advanced-header {
        flex-direction: column;
      }

      .stats-grid,
      .charts-grid {
        grid-template-columns: 1fr;
      }

      .chart-box,
      .chart-box-lg,
      .chart-box-xl {
        height: 320px;
      }
    }
  `]
})
export class AnaliticaPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly resumen = signal<AnaliticaResumen | null>(null);
  protected readonly isAdvancedMode = signal(false);
  protected readonly commercePeriod = signal<CommercePeriod>('MENSUAL');

  protected readonly commercePeriods: CommercePeriodTab[] = [
    { value: 'DIARIO', label: 'Diario' },
    { value: 'MENSUAL', label: 'Mensual' },
    { value: 'ANUAL', label: 'Anual' }
  ];

  protected readonly simpleKpiGroup: KPIGroup = {
    title: 'KPIs simples',
    description: 'Lectura rápida para entender salud financiera sin saturar.',
    labels: ['Ingresos', 'Salidas', 'Balance Neto', 'Movimientos', 'Recaudación QR']
  };

  protected readonly advancedKpiGroup: KPIGroup = {
    title: 'KPIs avanzados',
    description: 'Métricas más específicas para análisis operativo y de comportamiento.',
    labels: [
      'Transferencias',
      'Pagos QR',
      'QR fijo',
      'QR abierto',
      'Ticket prom. QR',
      'Ticket prom. transferencia',
      'Top comercio',
      'Top contraparte',
      'Categoría dominante',
      'Mes con mayor recaudación'
    ]
  };

  protected readonly simpleMetrics = computed<MetricCard[]>(() => {
    const resumen = this.resumen();
    const ingresos = resumen?.totales?.ingresosSoles ?? 0;
    const salidas = resumen?.totales?.salidasSoles ?? 0;
    const balance = resumen?.totales?.balanceNetoSoles ?? 0;
    const movimientos = resumen?.totales?.totalTransacciones ?? 0;
    const qrRevenue = this.getReceivedQrRevenue();

    return [
      { label: 'Ingresos', value: `S/ ${this.formatMoney(ingresos)}`, tone: 'emerald' },
      { label: 'Salidas', value: `S/ ${this.formatMoney(salidas)}`, tone: 'rose' },
      { label: 'Balance Neto', value: `S/ ${this.formatMoney(balance)}`, tone: balance >= 0 ? 'emerald' : 'rose' },
      { label: 'Total de movimientos', value: String(movimientos), tone: 'amber' },
      { label: 'Monto recaudado por QR', value: `S/ ${this.formatMoney(qrRevenue)}`, tone: 'emerald' }
    ];
  });

  protected readonly advancedMetrics = computed<MetricCard[]>(() => {
    const transferencias = this.getOutgoingTransfers();
    const qrRecibidos = this.getReceivedQrTransactions();
    const qrFijo = qrRecibidos.filter((item) => item.tipoQr === 'FIJO').length;
    const qrAbierto = qrRecibidos.filter((item) => item.tipoQr !== 'FIJO').length;
    const avgQr = this.getAverageTransactionAmount(qrRecibidos);
    const avgTransfer = this.getAverageTransactionAmount(transferencias);

    return [
      { label: 'Transferencias realizadas', value: String(transferencias.length), tone: 'slate' },
      { label: 'Pagos QR realizados', value: String(qrRecibidos.length), tone: 'slate' },
      { label: 'QR fijo', value: String(qrFijo), tone: 'amber' },
      { label: 'QR abierto', value: String(qrAbierto), tone: 'amber' },
      { label: 'Ticket prom. QR', value: `S/ ${this.formatMoney(avgQr)}`, tone: 'emerald' },
      { label: 'Ticket prom. transferencia', value: `S/ ${this.formatMoney(avgTransfer)}`, tone: 'rose' },
      { label: 'Top comercio del período', value: this.getTopCommerceName(), tone: 'slate' },
      { label: 'Top contraparte del período', value: this.getTopCounterpartName(), tone: 'slate' },
      { label: 'Categoría dominante', value: this.getDominantExpenseCategory(), tone: 'slate' },
      { label: 'Mes con mayor recaudación', value: this.getMonthWithHighestRevenue(), tone: 'slate' }
    ];
  });

  protected readonly dailyOptions = computed<HighchartsOptions>(() =>
    this.buildDailyOptions(this.resumen()?.porDia ?? [])
  );

  protected readonly monthlyOptions = computed<HighchartsOptions>(() =>
    this.buildMonthlyOptions(this.resumen()?.historicoMensual ?? [])
  );

  protected readonly expenseDonutOptions = computed<HighchartsOptions>(() =>
    this.buildExpenseDonutOptions(this.resumen()?.movimientos ?? [])
  );

  protected readonly commercePerformance = computed<CommercePerformanceRow[]>(() =>
    this.buildCommercePerformance(this.resumen()?.movimientos ?? [], this.commercePeriod())
  );

  protected readonly commerceBarOptions = computed<HighchartsOptions>(() =>
    this.buildCommerceBarOptions(this.commercePerformance(), this.commercePeriod())
  );

  protected readonly qrSplitOptions = computed<HighchartsOptions>(() =>
    this.buildQrSplitOptions(this.getReceivedQrTransactions())
  );

  protected readonly insightCards = computed<InsightCard[]>(() => {
    const resumen = this.resumen();
    const averageDailyExpense = this.getAverageDailyExpense();
    const biggestExpense = this.getMayorGastoReal();
    const dayWithHighestExpense = resumen?.insights?.diaMayorGasto?.dia ?? 'Sin datos';

    return [
      {
        title: 'Gasto Promedio Diario',
        text: `En lo que va del mes, tu promedio diario de salidas es S/ ${this.formatMoney(averageDailyExpense)}.`
      },
      {
        title: 'Día con mayor gasto',
        text: `Tu día de mayor gasto suele ser los ${dayWithHighestExpense}.`
      },
      {
        title: 'Mayor Gasto Real',
        text: this.buildMayorGastoText(biggestExpense)
      }
    ];
  });

  protected readonly topContrapartes = computed(() => this.resumen()?.topContrapartes ?? []);
  protected readonly transactions = computed(() => this.resumen()?.movimientos ?? []);

  ngOnInit(): void {
    this.http
      .get<AnaliticaResumen>(`${environment.apiBaseUrl}/analitica/resumen`, {
        headers: this.authService.getAuthHeaders()
      })
      .subscribe({
        next: (data) => {
          this.resumen.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  protected toggleAdvancedMode(): void {
    this.isAdvancedMode.update((value) => !value);
  }

  protected selectCommercePeriod(period: CommercePeriod): void {
    this.commercePeriod.set(period);
  }

  protected isSelectedPeriod(period: CommercePeriod): boolean {
    return this.commercePeriod() === period;
  }

  protected isCurrencyCard(label: string): boolean {
    return label !== 'Movimientos';
  }

  protected isSimpleMode(): boolean {
    return !this.isAdvancedMode();
  }

  private getReceivedQrTransactions(): AnaliticaMovimiento[] {
    return this.transactions().filter(
      (item) => item.tipoMovimiento === 'INGRESO' && item.tipo === 'PAGO_QR'
    );
  }

  private getReceivedQrRevenue(): number {
    return this.getReceivedQrTransactions().reduce((acc, item) => acc + item.montoSoles, 0);
  }

  private getOutgoingTransfers(): AnaliticaMovimiento[] {
    return this.transactions().filter(
      (item) => item.tipoMovimiento === 'SALIDA' && item.tipo === 'TRANSFERENCIA'
    );
  }

  private getAverageTransactionAmount(transactions: AnaliticaMovimiento[]): number {
    if (!transactions.length) return 0;

    const total = transactions.reduce((acc, item) => acc + item.montoSoles, 0);
    return total / transactions.length;
  }

  private getTopCommerceName(): string {
    return this.commercePerformance()[0]?.name ?? 'Sin datos';
  }

  private getTopCounterpartName(): string {
    return this.topContrapartes()[0]?.nombre ?? 'Sin datos';
  }

  private getMonthWithHighestRevenue(): string {
    const months = this.resumen()?.historicoMensual ?? [];
    if (!months.length) return 'Sin datos';

    const peak = months.reduce((best, current) =>
      current.ingresosSoles > best.ingresosSoles ? current : best
    , months[0]);

    return this.formatMonthLabel(peak.mes);
  }

  protected periodLabel(period: CommercePeriod): string {
    switch (period) {
      case 'DIARIO':
        return 'Hoy';
      case 'MENSUAL':
        return 'Este mes';
      case 'ANUAL':
        return 'Este año';
      default:
        return 'Periodo';
    }
  }

  private buildDailyOptions(data: AnaliticaResumen['porDia']): HighchartsOptions {
    const categories = data.map((item) => item.fecha);

    return {
      chart: {
        type: 'line',
        backgroundColor: 'transparent',
        style: { fontFamily: 'Inter, sans-serif' }
      },
      title: {
        text: 'Ingresos vs salidas',
        style: { color: '#f8fafc', fontWeight: '700' }
      },
      credits: { enabled: false },
      legend: {
        itemStyle: { color: '#cbd5e1' }
      },
      xAxis: {
        categories,
        labels: { style: { color: '#94a3b8' } },
        lineColor: 'rgba(255,255,255,.14)'
      },
      yAxis: {
        title: { text: 'Soles', style: { color: '#94a3b8' } },
        labels: { style: { color: '#94a3b8' } },
        gridLineColor: 'rgba(255,255,255,.08)'
      },
      tooltip: {
        shared: true,
        backgroundColor: 'rgba(15, 23, 42, 0.96)',
        borderColor: 'rgba(255,255,255,.12)',
        style: { color: '#e2e8f0' },
        pointFormat: '<span style="color:{series.color}">●</span> {series.name}: <b>S/ {point.y:,.2f}</b><br/>'
      },
      series: [
        {
          type: 'line',
          name: 'Ingresos',
          data: data.map((item) => item.ingresosSoles),
          color: '#22c55e',
          lineWidth: 3,
          marker: {
            fillColor: '#22c55e',
            lineColor: '#22c55e'
          }
        },
        {
          type: 'line',
          name: 'Salidas',
          data: data.map((item) => item.salidasSoles),
          color: '#fb7185',
          lineWidth: 3,
          marker: {
            fillColor: '#fb7185',
            lineColor: '#fb7185'
          }
        }
      ]
    } as HighchartsOptions;
  }

  private buildMonthlyOptions(data: AnaliticaResumen['historicoMensual']): HighchartsOptions {
    const categories = data.map((item) => this.formatMonthLabel(item.mes));

    return {
      chart: {
        type: 'column',
        backgroundColor: 'transparent',
        style: { fontFamily: 'Inter, sans-serif' }
      },
      title: {
        text: 'Histórico mensual',
        style: { color: '#f8fafc', fontWeight: '700' }
      },
      credits: { enabled: false },
      legend: {
        itemStyle: { color: '#cbd5e1' }
      },
      xAxis: {
        categories,
        labels: { style: { color: '#94a3b8' } },
        lineColor: 'rgba(255,255,255,.14)'
      },
      yAxis: {
        title: { text: 'Soles', style: { color: '#94a3b8' } },
        labels: { style: { color: '#94a3b8' } },
        gridLineColor: 'rgba(255,255,255,.08)'
      },
      tooltip: {
        shared: true,
        backgroundColor: 'rgba(15, 23, 42, 0.96)',
        borderColor: 'rgba(255,255,255,.12)',
        style: { color: '#e2e8f0' },
        pointFormat: '<span style="color:{series.color}">●</span> {series.name}: <b>S/ {point.y:,.2f}</b><br/>'
      },
      plotOptions: {
        column: {
          grouping: true,
          borderWidth: 0,
          borderRadius: 8,
          pointPadding: 0.08,
          groupPadding: 0.14
        }
      },
      series: [
        {
          type: 'column',
          name: 'Ingresos',
          data: data.map((item) => item.ingresosSoles),
          color: '#22c55e'
        },
        {
          type: 'column',
          name: 'Salidas',
          data: data.map((item) => item.salidasSoles),
          color: '#fb7185'
        }
      ]
    } as HighchartsOptions;
  }

  private buildExpenseDonutOptions(transactions: AnaliticaMovimiento[]): HighchartsOptions {
    const grouped = this.groupExpenseCategories(transactions);

    return {
      chart: {
        type: 'pie',
        backgroundColor: 'transparent',
        style: { fontFamily: 'Inter, sans-serif' }
      },
      title: {
        text: 'Dona de gastos por categoría',
        style: { color: '#f8fafc', fontWeight: '700' }
      },
      credits: { enabled: false },
      colors: ['#22c55e', '#38bdf8', '#f97316', '#f59e0b', '#a78bfa', '#14b8a6', '#fb7185'],
      legend: {
        itemStyle: { color: '#cbd5e1' }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.96)',
        borderColor: 'rgba(255,255,255,.12)',
        style: { color: '#e2e8f0' },
        pointFormat: '<b>S/ {point.y:,.2f}</b> ({point.percentage:.1f}%)'
      },
      plotOptions: {
        pie: {
          innerSize: '60%',
          borderWidth: 0,
          dataLabels: {
            enabled: true,
            distance: 14,
            style: {
              color: '#e2e8f0',
              textOutline: 'none',
              fontWeight: '600'
            }
          }
        }
      },
      series: [
        {
          type: 'pie',
          name: 'Gastos',
          data: grouped.map((item) => ({
            name: item.name,
            y: item.totalSoles
          }))
        }
      ]
    } as HighchartsOptions;
  }

  private buildCommerceBarOptions(
    rows: CommercePerformanceRow[],
    period: CommercePeriod
  ): HighchartsOptions {
    return {
      chart: {
        type: 'bar',
        backgroundColor: 'transparent',
        style: { fontFamily: 'Inter, sans-serif' }
      },
      title: {
        text: 'Top Comercios con Mayor Recaudación',
        style: { color: '#f8fafc', fontWeight: '700' }
      },
      subtitle: {
        text: this.periodLabel(period),
        style: { color: '#94a3b8' }
      },
      credits: { enabled: false },
      legend: { enabled: false },
      colors: ['#22c55e', '#38bdf8', '#f97316', '#a78bfa', '#f59e0b', '#14b8a6', '#fb7185'],
      xAxis: {
        categories: rows.map((item) => item.name),
        labels: { style: { color: '#cbd5e1', fontWeight: '600' } },
        lineColor: 'rgba(255,255,255,.14)'
      },
      yAxis: {
        title: { text: 'Soles', style: { color: '#94a3b8' } },
        labels: { style: { color: '#94a3b8' } },
        gridLineColor: 'rgba(255,255,255,.08)'
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.96)',
        borderColor: 'rgba(255,255,255,.12)',
        style: { color: '#e2e8f0' },
        pointFormat: '<b>S/ {point.y:,.2f}</b>'
      },
      plotOptions: {
        bar: {
          borderWidth: 0,
          borderRadius: 6,
          pointPadding: 0.12,
          groupPadding: 0.08,
          dataLabels: {
            enabled: true,
            style: {
              color: '#f8fafc',
              textOutline: 'none',
              fontWeight: '600'
            }
          }
        }
      },
      series: [
        {
          type: 'bar',
          name: 'Recaudación',
          colorByPoint: true,
          data: rows.map((item) => item.totalSoles)
        }
      ]
    } as HighchartsOptions;
  }

  private buildCommercePerformance(
    transactions: AnaliticaMovimiento[],
    period: CommercePeriod
  ): CommercePerformanceRow[] {
    const filtered = this.filterTransactions(transactions, period).filter(
      (item) => item.tipoMovimiento === 'INGRESO' && item.tipo === 'PAGO_QR'
    );
    const grouped = new Map<string, CommercePerformanceRow>();

    for (const item of filtered) {
      const commerceName =
        this.normalizeLabel(item.comercioNombre) ??
        this.normalizeLabel(item.contraparteNombre) ??
        this.normalizeLabel(item.comercioCategoria);
      if (!commerceName) continue;

      const current = grouped.get(commerceName) ?? {
        name: commerceName,
        totalSoles: 0,
        transactions: 0
      };

      current.totalSoles += item.montoSoles;
      current.transactions += 1;
      grouped.set(commerceName, current);
    }

    return [...grouped.values()].sort((a, b) => b.totalSoles - a.totalSoles).slice(0, 8);
  }

  private buildQrSplitOptions(transactions: AnaliticaMovimiento[]): HighchartsOptions {
    const grouped = transactions.reduce<Record<string, number>>((acc, item) => {
      const key = item.tipoQr === 'FIJO' ? 'QR fijo' : 'QR abierto';
      acc[key] = (acc[key] || 0) + item.montoSoles;
      return acc;
    }, {});

    const data: CommerceSplitRow[] = [
      { label: 'QR fijo', totalSoles: grouped['QR fijo'] || 0 },
      { label: 'QR abierto', totalSoles: grouped['QR abierto'] || 0 }
    ].filter((item) => item.totalSoles > 0);

    return {
      chart: {
        type: 'pie',
        backgroundColor: 'transparent',
        style: { fontFamily: 'Inter, sans-serif' }
      },
      title: {
        text: 'Distribución QR fijo vs QR abierto',
        style: { color: '#f8fafc', fontWeight: '700' }
      },
      subtitle: {
        text: 'Recaudación recibida por tipo de QR',
        style: { color: '#94a3b8' }
      },
      credits: { enabled: false },
      colors: ['#38bdf8', '#f97316'],
      legend: {
        itemStyle: { color: '#cbd5e1' }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.96)',
        borderColor: 'rgba(255,255,255,.12)',
        style: { color: '#e2e8f0' },
        pointFormat: '<b>S/ {point.y:,.2f}</b> ({point.percentage:.1f}%)'
      },
      plotOptions: {
        pie: {
          innerSize: '60%',
          borderWidth: 0,
          dataLabels: {
            enabled: true,
            distance: 14,
            style: {
              color: '#e2e8f0',
              textOutline: 'none',
              fontWeight: '600'
            }
          }
        }
      },
      series: [
        {
          type: 'pie',
          name: 'QR',
          data: data.map((item) => ({ name: item.label, y: item.totalSoles }))
        }
      ]
    } as HighchartsOptions;
  }

  protected buildAdvancedKpiSummary(): string {
    const resumen = this.resumen();
    const dominantCategory = this.getDominantExpenseCategory();
    const leadCommerce = this.commercePerformance()[0]?.name ?? 'Sin datos';
    const averageDaily = this.getAverageDailyExpense();
    const majorExpense = this.getMayorGastoReal();
    const majorExpenseText = majorExpense
      ? this.buildMayorGastoText(majorExpense)
      : 'Aún no hay datos suficientes para calcular el mayor gasto real.';

    return [
      `Gasto Promedio Diario: S/ ${this.formatMoney(averageDaily)}`,
      `Mayor Gasto Real: ${majorExpenseText}`,
      `Categoría dominante: ${dominantCategory}`,
      `Comercio líder: ${leadCommerce}`,
      `Movimientos del periodo: ${resumen?.totales?.totalTransacciones ?? 0}`
    ].join(' | ');
  }

  private groupExpenseCategories(
    transactions: AnaliticaMovimiento[]
  ): Array<{ name: string; totalSoles: number }> {
    const grouped = new Map<string, number>();

    for (const item of transactions) {
      if (item.tipoMovimiento !== 'SALIDA') continue;

      const category = this.resolveExpenseCategory(item);
      if (!category) continue;

      grouped.set(category, (grouped.get(category) ?? 0) + item.montoSoles);
    }

    return [...grouped.entries()]
      .map(([name, totalSoles]) => ({ name, totalSoles }))
      .sort((a, b) => b.totalSoles - a.totalSoles);
  }

  private resolveExpenseCategory(transaction: AnaliticaMovimiento): string | null {
    if (transaction.tipo === 'TRANSFERENCIA') {
      return 'Envío a Contactos';
    }

    if (transaction.tipo === 'PAGO_QR') {
      return this.normalizeLabel(transaction.comercioCategoria) ?? 'Pagos QR Varios';
    }

    return 'Otros gastos';
  }

  private buildMayorGastoText(transaction: AnaliticaMovimiento | MayorGastoReal | null): string {
    if (!transaction) {
      return 'Aún no hay salidas suficientes este mes para calcularlo.';
    }

    const amount = this.formatMoney(transaction.montoSoles);

    if (transaction.tipo === 'TRANSFERENCIA') {
      return `Tu mayor gasto fue un Envío a Contacto a ${transaction.contraparteNombre ?? 'Contacto'} por S/ ${amount}.`;
    }

    if (transaction.tipo === 'PAGO_QR') {
      const commerceLabel =
        this.normalizeLabel(transaction.comercioNombre ?? null) ??
        this.normalizeLabel(transaction.contraparteNombre) ??
        'Comercio';
      return `Tu mayor gasto fue en el comercio ${commerceLabel} por S/ ${amount}.`;
    }

    return `Tu mayor gasto fue por S/ ${amount}.`;
  }

  private getAverageDailyExpense(): number {
    const monthTransactions = this.filterTransactions(this.transactions(), 'MENSUAL');
    const currentMonthExpenses = monthTransactions.filter((item) => item.tipoMovimiento === 'SALIDA');
    const daysElapsed = Math.max(1, new Date().getDate());
    const totalExpenses = currentMonthExpenses.reduce((acc, item) => acc + item.montoSoles, 0);
    return totalExpenses / daysElapsed;
  }

  private getMayorGastoReal(): MayorGastoReal | null {
    const monthTransactions = this.filterTransactions(this.transactions(), 'MENSUAL');
    const currentMonthExpenses = monthTransactions.filter((item) => item.tipoMovimiento === 'SALIDA');
    const biggestExpense = currentMonthExpenses.slice().sort((a, b) => b.montoCentavos - a.montoCentavos)[0];

    if (!biggestExpense) return null;

    return {
      tipo: biggestExpense.tipo,
      contraparteNombre: biggestExpense.contraparteNombre,
      comercioNombre: biggestExpense.comercioNombre,
      montoSoles: biggestExpense.montoSoles
    };
  }

  private getDominantExpenseCategory(): string {
    const dominant = this.groupExpenseCategories(
      this.filterTransactions(this.transactions(), 'MENSUAL')
    )[0];

    return dominant?.name ?? 'Sin categoría';
  }

  private filterTransactions(transactions: AnaliticaMovimiento[], period: CommercePeriod): AnaliticaMovimiento[] {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    switch (period) {
      case 'DIARIO':
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() + 1);
        end.setHours(0, 0, 0, 0);
        break;
      case 'MENSUAL':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 1);
        end.setHours(0, 0, 0, 0);
        break;
      case 'ANUAL':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setFullYear(end.getFullYear() + 1, 0, 1);
        end.setHours(0, 0, 0, 0);
        break;
    }

    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.createdAt);
      return transactionDate >= start && transactionDate < end;
    });
  }

  private formatMonthLabel(value: string): string {
    if (!value) return '';

    const [year, month] = value.split('-').map((part) => Number(part));
    const date = new Date(Date.UTC(year, month - 1, 1));

    return new Intl.DateTimeFormat('es-PE', { month: 'short', year: 'numeric' }).format(date);
  }

  private formatMoney(value: number): string {
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  private normalizeLabel(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
