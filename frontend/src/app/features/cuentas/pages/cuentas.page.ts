import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-cuentas-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cuentas-page">
      <h1 class="page-title">Mis Cuentas</h1>
      <p class="page-subtitle">Gestiona tus cuentas, saldo y configuración financiera.</p>

      <div class="loading" *ngIf="loading()">Cargando cuentas...</div>

      <div class="cuentas-content" *ngIf="!loading()">
        <!-- Saldo Card -->
        <div class="saldo-card" *ngIf="saldoInfo()">
          <div class="saldo-header">
            <span class="saldo-label">Saldo disponible</span>
            <span class="badge" [ngClass]="{
              'badge-success': saldoInfo()?.estado === 'ACTIVA',
              'badge-warning': saldoInfo()?.estado === 'SUSPENDIDA',
              'badge-error': saldoInfo()?.estado === 'CERRADA'
            }">{{ saldoInfo()?.estado }}</span>
          </div>
          <div class="saldo-amount">
            <span class="currency">S/</span>
            <span class="amount">{{ saldoInfo()?.saldoSoles }}</span>
          </div>
          <div class="saldo-details">
            <div class="saldo-detail">
              <span class="detail-label">Cuenta</span>
              <span class="detail-value">{{ saldoInfo()?.numeroCuentaEnmascarado }}</span>
            </div>
            <div class="saldo-detail">
              <span class="detail-label">Banco</span>
              <span class="detail-value">{{ saldoInfo()?.bancoNombre }}</span>
            </div>
          </div>
        </div>

        <!-- Cuentas List -->
        <div class="section" *ngIf="cuentas().length">
          <h2>Detalle de cuentas</h2>
          <div class="cuentas-grid">
            <div class="cuenta-card" *ngFor="let cuenta of cuentas()">
              <div class="cuenta-header">
                <span class="cuenta-num">{{ cuenta.numero_cuenta_enmascarado }}</span>
                <span class="badge" [ngClass]="{
                  'badge-success': cuenta.estado === 'ACTIVA',
                  'badge-warning': cuenta.estado === 'SUSPENDIDA',
                  'badge-error': cuenta.estado === 'CERRADA'
                }">{{ cuenta.estado }}</span>
              </div>
              <div class="cuenta-body">
                <div class="cuenta-row">
                  <span>Saldo</span>
                  <strong>S/ {{ (cuenta.saldo_centavos / 100).toFixed(2) }}</strong>
                </div>
                <div class="cuenta-row">
                  <span>Límite diario</span>
                  <span>S/ {{ (cuenta.limite_diario_centavos / 100).toFixed(2) }}</span>
                </div>
                <div class="cuenta-row">
                  <span>Banco</span>
                  <span>{{ cuenta.banco_nombre }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Configuración -->
        <div class="config-section">
          <h2>Configuración</h2>
          <div class="config-grid">
            <!-- Límite diario -->
            <div class="config-card">
              <h3>📊 Límite diario</h3>
              <p>Configura el tope máximo de gasto por día.</p>
              <div class="inline-form">
                <div class="field">
                  <label for="limite">Monto en soles</label>
                  <input id="limite" type="number" [(ngModel)]="limiteSoles" min="0" step="0.01" />
                </div>
                <button class="btn-action" (click)="setLimite()" [disabled]="savingLimite()">
                  {{ savingLimite() ? 'Guardando...' : 'Guardar' }}
                </button>
              </div>
              <div class="msg-success" *ngIf="limiteMsg()">{{ limiteMsg() }}</div>
            </div>

            <!-- Cambiar banco -->
            <div class="config-card">
              <h3>🏦 Banco asociado</h3>
              <p>Cambia el banco vinculado a tu cuenta.</p>
              <div class="inline-form">
                <div class="field">
                  <label for="banco-select">Banco</label>
                  <select id="banco-select" [(ngModel)]="selectedBancoId">
                    <option value="" disabled>Seleccionar...</option>
                    <option *ngFor="let b of bancos()" [value]="b.id">{{ b.nombre }}</option>
                  </select>
                </div>
                <button class="btn-action" (click)="cambiarBanco()" [disabled]="savingBanco()">
                  {{ savingBanco() ? 'Guardando...' : 'Cambiar' }}
                </button>
              </div>
              <div class="msg-success" *ngIf="bancoMsg()">{{ bancoMsg() }}</div>
            </div>

            <!-- Estado de cuenta -->
            <div class="config-card">
              <h3>⚡ Estado de cuenta</h3>
              <p>Activa o suspende tu cuenta temporalmente.</p>
              <div class="inline-form">
                <div class="field">
                  <label for="estado-select">Estado</label>
                  <select id="estado-select" [(ngModel)]="selectedEstado">
                    <option value="ACTIVA">ACTIVA</option>
                    <option value="SUSPENDIDA">SUSPENDIDA</option>
                  </select>
                </div>
                <button class="btn-action" (click)="cambiarEstado()" [disabled]="savingEstado()">
                  {{ savingEstado() ? 'Guardando...' : 'Actualizar' }}
                </button>
              </div>
              <div class="msg-success" *ngIf="estadoMsg()">{{ estadoMsg() }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="msg-error" *ngIf="errorMsg()">{{ errorMsg() }}</div>
    </div>
  `,
  styles: [`
    .cuentas-page {
      max-width: 900px;
      animation: fadeIn 0.4s ease;
    }
    .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
    .page-subtitle { color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem; }
    .loading { padding: 1rem; background: var(--info-bg); color: var(--info); border-radius: var(--radius-md); }

    .badge { display: inline-flex; padding: 0.2rem 0.6rem; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 500; }
    .badge-success { background: var(--success-bg); color: var(--success); }
    .badge-warning { background: var(--warning-bg); color: var(--warning); }
    .badge-error { background: var(--error-bg); color: var(--error); }

    /* Saldo Card */
    .saldo-card {
      background: linear-gradient(135deg, var(--primary-900), var(--bg-card));
      border: 1px solid var(--primary-700);
      border-radius: var(--radius-xl);
      padding: 2rem;
      margin-bottom: 1.5rem;
      box-shadow: var(--shadow-glow);
    }
    .saldo-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;
    }
    .saldo-label { font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    .saldo-amount { display: flex; align-items: baseline; gap: 0.3rem; margin-bottom: 1.25rem; }
    .currency { font-size: 1.5rem; color: var(--primary-300); font-weight: 600; }
    .amount { font-size: 3rem; font-weight: 800; }
    .saldo-details { display: flex; gap: 2rem; }
    .saldo-detail { display: flex; flex-direction: column; }
    .detail-label { font-size: 0.75rem; color: var(--text-muted); }
    .detail-value { font-size: 0.95rem; font-weight: 500; }

    /* Cuentas Grid */
    .section { margin-bottom: 2rem; }
    .section h2, .config-section h2 { font-size: 1.15rem; font-weight: 600; margin-bottom: 1rem; }
    .cuentas-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
    .cuenta-card {
      background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.25rem;
      transition: all var(--transition-fast);
    }
    .cuenta-card:hover { border-color: var(--primary-700); }
    .cuenta-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .cuenta-num { font-weight: 600; font-size: 1.1rem; }
    .cuenta-row { display: flex; justify-content: space-between; padding: 0.4rem 0; font-size: 0.9rem; }
    .cuenta-row span { color: var(--text-secondary); }
    .cuenta-row strong { color: var(--primary-400); }

    /* Config */
    .config-section { margin-bottom: 1.5rem; }
    .config-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
    .config-card {
      background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.25rem;
    }
    .config-card h3 { font-size: 1rem; font-weight: 600; margin-bottom: 0.3rem; }
    .config-card p { color: var(--text-secondary); font-size: 0.82rem; margin-bottom: 0.75rem; }
    .inline-form { display: flex; gap: 0.5rem; align-items: flex-end; }
    .field { display: flex; flex-direction: column; gap: 0.2rem; flex: 1; }
    .field label { font-size: 0.75rem; color: var(--text-muted); }
    .field input, .field select {
      padding: 0.55rem 0.7rem;
      background: var(--bg-input); border: 1px solid var(--border-default); border-radius: var(--radius-sm);
      color: var(--text-primary); font-size: 0.85rem; font-family: inherit; outline: none;
      transition: border-color var(--transition-fast);
    }
    .field input:focus, .field select:focus {
      border-color: var(--primary-500);
    }
    .field select option {
      background: var(--bg-card);
      color: var(--text-primary);
    }
    .btn-action {
      padding: 0.55rem 1rem;
      background: linear-gradient(135deg, var(--primary-600), var(--primary-500));
      color: #fff; border: none; border-radius: var(--radius-sm);
      font-weight: 600; font-family: inherit; cursor: pointer;
      font-size: 0.82rem; white-space: nowrap;
      transition: all var(--transition-fast);
    }
    .btn-action:hover:not(:disabled) { box-shadow: var(--shadow-glow); }
    .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }

    .msg-success { margin-top: 0.5rem; padding: 0.4rem 0.6rem; background: var(--success-bg); color: var(--success); border-radius: var(--radius-sm); font-size: 0.8rem; }
    .msg-error { margin-top: 0.75rem; padding: 0.5rem 0.8rem; background: var(--error-bg); color: var(--error); border-radius: var(--radius-sm); font-size: 0.85rem; }

    @media (max-width: 600px) {
      .saldo-details { flex-direction: column; gap: 0.5rem; }
      .inline-form { flex-direction: column; align-items: stretch; }
    }
  `]
})
export class CuentasPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = environment.apiBaseUrl;

  protected loading = signal(true);
  protected saldoInfo = signal<any>(null);
  protected cuentas = signal<any[]>([]);
  protected bancos = signal<any[]>([]);
  protected errorMsg = signal('');

  protected limiteSoles = 500;
  protected savingLimite = signal(false);
  protected limiteMsg = signal('');

  protected selectedBancoId = '';
  protected savingBanco = signal(false);
  protected bancoMsg = signal('');

  protected selectedEstado = 'ACTIVA';
  protected savingEstado = signal(false);
  protected estadoMsg = signal('');

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    const headers = this.authService.getAuthHeaders();

    this.http.get<any>(`${this.apiUrl}/cuentas/saldo`, { headers }).subscribe({
      next: (data) => {
        this.saldoInfo.set(data);
        this.limiteSoles = (data.limiteDiarioCentavos || 50000) / 100;
      },
      error: () => {}
    });

    this.http.get<any[]>(`${this.apiUrl}/cuentas`, { headers }).subscribe({
      next: (data) => { this.cuentas.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });

    this.http.get<any[]>(`${this.apiUrl}/cuentas/bancos`, { headers }).subscribe({
      next: (data) => this.bancos.set(data),
      error: () => {}
    });
  }

  setLimite(): void {
    this.savingLimite.set(true);
    this.limiteMsg.set('');
    const headers = this.authService.getAuthHeaders();
    this.http.put<any>(`${this.apiUrl}/cuentas/limite-diario`, {
      limiteCentavos: Math.round(this.limiteSoles * 100)
    }, { headers }).subscribe({
      next: (data) => {
        this.savingLimite.set(false);
        this.limiteMsg.set(`Límite actualizado: S/ ${data.limiteDiarioSoles}`);
        this.cargarDatos();
      },
      error: () => { this.savingLimite.set(false); }
    });
  }

  cambiarBanco(): void {
    if (!this.selectedBancoId) return;
    this.savingBanco.set(true);
    this.bancoMsg.set('');
    const headers = this.authService.getAuthHeaders();
    this.http.patch<any>(`${this.apiUrl}/cuentas/banco`, {
      bancoId: this.selectedBancoId
    }, { headers }).subscribe({
      next: (data) => {
        this.savingBanco.set(false);
        this.bancoMsg.set(`Banco cambiado a: ${data.banco_nombre}`);
        this.cargarDatos();
      },
      error: () => { this.savingBanco.set(false); }
    });
  }

  cambiarEstado(): void {
    this.savingEstado.set(true);
    this.estadoMsg.set('');
    const headers = this.authService.getAuthHeaders();
    this.http.patch<any>(`${this.apiUrl}/cuentas/estado`, {
      estado: this.selectedEstado
    }, { headers }).subscribe({
      next: (data) => {
        this.savingEstado.set(false);
        this.estadoMsg.set(`Estado actualizado: ${data.estado}`);
        this.cargarDatos();
      },
      error: () => { this.savingEstado.set(false); }
    });
  }
}
