import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

interface Movimiento {
  id: string;
  monto_centavos: number;
  monto_soles: number;
  tipo: string;
  estado: string;
  descripcion: string | null;
  origen_nombre: string | null;
  destino_nombre: string | null;
  created_at: string;
  esSalida: boolean;
}

import { AppIconComponent } from '../../../shared/components/app-icon.component';

@Component({
  standalone: true,
  selector: 'app-movimientos-page',
  imports: [CommonModule, AppIconComponent],
  template: `
    <div class="movimientos-page">
      <h1 class="page-title">Movimientos</h1>
      <p class="page-subtitle">Historial de transacciones de tu cuenta.</p>

      <div class="loading" *ngIf="loading()">Cargando movimientos...</div>

      <div class="empty-state" *ngIf="!loading() && movimientos().length === 0">
        <app-icon name="clipboard-list" [size]="40" className="empty-icon" />
        <p>No hay movimientos registrados aún.</p>
      </div>

      <div class="movimientos-list" *ngIf="!loading() && movimientos().length > 0">
        <div class="summary-bar">
          <div class="summary-item">
            <span class="summary-label">Total movimientos</span>
            <span class="summary-value">{{ movimientos().length }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Entradas</span>
            <span class="summary-value text-success">{{ entradas() }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Salidas</span>
            <span class="summary-value text-error">{{ salidas() }}</span>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Origen / Destino</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let m of movimientos()" class="mov-row">
                <td class="date-cell">{{ m.created_at | date:'dd/MM/yy HH:mm' }}</td>
                <td>
                  <span class="tipo-badge" [ngClass]="'tipo-' + m.tipo.toLowerCase()">
                    {{ m.tipo }}
                  </span>
                </td>
                <td class="desc-cell">{{ m.descripcion || '—' }}</td>
                <td class="name-cell">
                  <span *ngIf="m.esSalida">→ {{ m.destino_nombre || '—' }}</span>
                  <span *ngIf="!m.esSalida">← {{ m.origen_nombre || 'Externo' }}</span>
                </td>
                <td class="monto-cell" [class.salida]="m.esSalida" [class.entrada]="!m.esSalida">
                  {{ m.esSalida ? '-' : '+' }} S/ {{ m.monto_soles | number:'1.2-2' }}
                </td>
                <td>
                  <span class="badge" [ngClass]="{
                    'badge-success': m.estado === 'COMPLETADA',
                    'badge-warning': m.estado === 'PENDIENTE',
                    'badge-error': m.estado === 'RECHAZADA' || m.estado === 'REVERTIDA'
                  }">{{ m.estado }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .movimientos-page {
      max-width: 1000px;
      animation: fadeIn 0.4s ease;
    }
    .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
    .page-subtitle { color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem; }
    .loading { padding: 1rem; background: var(--info-bg); color: var(--info); border-radius: var(--radius-md); }

    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
      padding: 3rem; background: var(--bg-card); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg); text-align: center;
    }
    .empty-icon { color: var(--primary-500); margin-bottom: 0.5rem; }
    .empty-state p { color: var(--text-secondary); }

    .summary-bar {
      display: flex; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap;
    }
    .summary-item {
      display: flex; flex-direction: column;
      background: var(--bg-card); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md); padding: 0.75rem 1.25rem;
    }
    .summary-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .summary-value { font-size: 1.3rem; font-weight: 700; }
    .text-success { color: var(--success); }
    .text-error { color: var(--error); }

    .table-container {
      background: var(--bg-card); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg); overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    thead th {
      padding: 0.75rem 1rem; text-align: left;
      background: var(--bg-elevated); color: var(--text-muted);
      font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;
      font-weight: 600; border-bottom: 1px solid var(--border-subtle);
    }
    tbody td {
      padding: 0.65rem 1rem; border-bottom: 1px solid var(--border-subtle);
      color: var(--text-secondary);
    }
    .mov-row { transition: background var(--transition-fast); }
    .mov-row:hover { background: rgba(255, 178, 0, 0.04); }

    .date-cell { white-space: nowrap; font-size: 0.82rem; }
    .desc-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .name-cell { font-size: 0.85rem; }

    .tipo-badge {
      display: inline-block; padding: 0.15rem 0.5rem;
      border-radius: var(--radius-full); font-size: 0.72rem;
      font-weight: 600; text-transform: uppercase;
    }
    .tipo-transferencia { background: var(--info-bg); color: var(--info); }
    .tipo-pago_qr { background: rgba(255, 178, 0, 0.12); color: var(--primary-500); }
    .tipo-recarga { background: var(--success-bg); color: var(--success); }
    .tipo-devolucion { background: var(--warning-bg); color: var(--warning); }

    .monto-cell { font-weight: 600; white-space: nowrap; font-size: 0.9rem; }
    .monto-cell.salida { color: var(--error); }
    .monto-cell.entrada { color: var(--success); }

    .badge { display: inline-flex; padding: 0.2rem 0.6rem; border-radius: var(--radius-full); font-size: 0.72rem; font-weight: 500; }
    .badge-success { background: var(--success-bg); color: var(--success); }
    .badge-warning { background: var(--warning-bg); color: var(--warning); }
    .badge-error { background: var(--error-bg); color: var(--error); }

    @media (max-width: 768px) {
      .table-container { overflow-x: auto; }
    }
  `]
})
export class MovimientosPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  protected movimientos = signal<Movimiento[]>([]);
  protected loading = signal(true);

  protected entradas = signal(0);
  protected salidas = signal(0);

  ngOnInit(): void {
    const headers = this.authService.getAuthHeaders();
    this.http.get<Movimiento[]>(`${environment.apiBaseUrl}/cuentas/movimientos`, { headers }).subscribe({
      next: (data) => {
        this.movimientos.set(data);
        this.entradas.set(data.filter(m => !m.esSalida).length);
        this.salidas.set(data.filter(m => m.esSalida).length);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
