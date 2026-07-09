import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-pagos-qr-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="qr-page">
      <h1 class="page-title">Pagos QR</h1>
      <p class="page-subtitle">Usa tu QR abierto personal para recibir pagos en cualquier momento.</p>

      <div class="qr-grid">
        <section class="panel">
          <h2>Mi QR abierto</h2>
          <div class="field" *ngIf="tipoQr() === 'FIJO'">
            <label for="comercio">Comercio</label>
            <select id="comercio" [(ngModel)]="comercioId">
              <option value="" disabled>Seleccionar...</option>
              <option *ngFor="let c of comercios()" [value]="c.id">
                {{ c.nombre_comercial || c.razon_social }}
              </option>
            </select>
          </div>

          <div class="mode-tabs">
            <button type="button" [class.active]="tipoQr() === 'ABIERTO'" (click)="tipoQr.set('ABIERTO')">Abierto</button>
            <button type="button" [class.active]="tipoQr() === 'FIJO'" (click)="tipoQr.set('FIJO')">Fijo</button>
          </div>

          <div class="field" *ngIf="tipoQr() === 'FIJO'">
            <label for="monto">Monto en soles</label>
            <input id="monto" type="number" [(ngModel)]="montoSoles" min="0.01" step="0.01" />
          </div>

          <div class="field" *ngIf="tipoQr() === 'FIJO'">
            <label for="expira">Expira en minutos</label>
            <input id="expira" type="number" [(ngModel)]="expiraMinutos" min="1" max="1440" />
          </div>

          <button class="btn-primary" type="button" (click)="crearQr()" [disabled]="creating()">
            {{ creating() ? 'Generando...' : (tipoQr() === 'ABIERTO' ? 'Ver mi QR' : 'Generar QR fijo') }}
          </button>
          <p class="msg-error" *ngIf="createError()">{{ createError() }}</p>

          <div class="qr-result" *ngIf="qrGenerado()">
            <img [src]="qrGenerado()?.qrImageDataUrl" alt="Codigo QR generado" />
            <div class="qr-code">{{ qrGenerado()?.codigo_qr }}</div>
          </div>
        </section>

        <section class="panel">
          <h2>Pagar QR</h2>
          <div class="field">
            <label for="codigo">Codigo QR</label>
            <textarea id="codigo" [(ngModel)]="codigoQr" rows="4"></textarea>
          </div>

          <div class="actions">
            <button class="btn-secondary" type="button" (click)="validarQr()" [disabled]="validating() || !codigoQr.trim()">
              {{ validating() ? 'Validando...' : 'Validar' }}
            </button>
          </div>
          <p class="msg-error" *ngIf="payError()">{{ payError() }}</p>

          <div class="qr-detail" *ngIf="qrValidado()">
            <div class="qr-preview" *ngIf="qrValidado()?.qrImageDataUrl">
              <img [src]="qrValidado()?.qrImageDataUrl" alt="QR validado" />
            </div>
            <span class="badge" [ngClass]="{
              'badge-warning': qrValidado()?.estado === 'PENDIENTE',
              'badge-success': qrValidado()?.estado === 'PAGADO',
              'badge-error': qrValidado()?.estado === 'EXPIRADO' || qrValidado()?.estado === 'CANCELADO'
            }">{{ qrValidado()?.estado }}</span>
            <strong>{{ qrValidado()?.nombre_comercial || qrValidado()?.razon_social }}</strong>
            <span>{{ qrValidado()?.tipo_qr }} - {{ qrValidado()?.montoSoles ? ('S/ ' + qrValidado()?.montoSoles) : 'Monto abierto' }}</span>
          </div>

          <div class="field" *ngIf="qrValidado()?.requiereMonto">
            <label for="montoPago">Monto en soles</label>
            <input id="montoPago" type="number" [(ngModel)]="montoPagoSoles" min="0.01" step="0.01" />
          </div>

          <button
            class="btn-primary btn-pay"
            type="button"
            (click)="pagarQr()"
            *ngIf="qrValidado()"
            [disabled]="paying() || qrValidado()?.estado !== 'PENDIENTE'"
          >
            {{ paying() ? 'Procesando pago...' : 'Pagar QR' }}
          </button>
          <p class="help-pay" *ngIf="qrValidado() && qrValidado()?.estado !== 'PENDIENTE'">
            Este QR ya no acepta pagos (estado: {{ qrValidado()?.estado }}).
          </p>

          <div class="qr-detail success" *ngIf="pagoResultado()">
            <strong>Pago completado</strong>
            <span>{{ pagoResultado()?.comprobante?.codigo }}</span>
            <span>S/ {{ pagoResultado()?.comprobante?.montoSoles }}</span>
          </div>
        </section>
      </div>

      <section class="panel history">
        <h2>QR disponibles</h2>
        <div class="empty" *ngIf="!qrs().length">Aun no hay cobros QR.</div>
        <div class="qr-list" *ngIf="qrs().length">
          <div class="qr-row" *ngFor="let q of qrs()">
            <div>
              <strong>{{ q.nombre_comercial || q.razon_social }}</strong>
              <span>{{ q.tipo_qr }} - {{ q.monto_centavos ? ('S/ ' + (q.monto_centavos / 100).toFixed(2)) : 'Monto abierto' }}</span>
            </div>
            <span class="badge" [ngClass]="{
              'badge-warning': q.estado === 'PENDIENTE',
              'badge-success': q.estado === 'PAGADO',
              'badge-error': q.estado === 'EXPIRADO' || q.estado === 'CANCELADO'
            }">{{ q.estado }}</span>
            <button type="button" class="btn-link" (click)="cancelar(q.id)" *ngIf="q.estado === 'PENDIENTE' && q.tipo_qr !== 'ABIERTO'">Cancelar</button>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .qr-page { max-width: 1120px; animation: fadeIn 0.4s ease; }
    .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; color: #ffffff; }
    .page-subtitle { color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem; }
    .qr-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; align-items: start; margin-bottom: 1rem; }
    .panel { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.25rem; border-top: 2px solid var(--primary-500); }
    .panel h2 { font-size: 1.05rem; margin-bottom: 0.9rem; color: var(--primary-500); }
    .field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.8rem; }
    .field label { color: var(--text-muted); font-size: 0.78rem; }
    .field input, .field select, .field textarea { padding: 0.65rem 0.75rem; background: var(--bg-input); border: 1px solid var(--border-default); border-radius: var(--radius-sm); color: var(--text-primary); font: inherit; outline: none; resize: vertical; }
    .field input:focus, .field select:focus, .field textarea:focus { border-color: var(--primary-500); box-shadow: 0 0 0 2px rgba(255, 178, 0, 0.15); }
    .mode-tabs { display: inline-flex; background: var(--bg-input); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 0.2rem; margin-bottom: 0.8rem; }
    .mode-tabs button { border: 0; background: transparent; color: var(--text-secondary); padding: 0.45rem 0.8rem; border-radius: var(--radius-sm); font: inherit; cursor: pointer; transition: color var(--transition-fast); }
    .mode-tabs button.active { background: var(--primary-500); color: #000000; font-weight: 700; }
    .actions { display: flex; gap: 0.6rem; }
    .btn-primary, .btn-secondary { border: 0; border-radius: var(--radius-sm); padding: 0.7rem 1rem; font-weight: 700; font-family: inherit; cursor: pointer; transition: all var(--transition-fast); }
    .btn-primary { background: linear-gradient(135deg, var(--primary-500), var(--primary-400)); color: #000000; }
    .btn-primary:hover:not(:disabled) { background: linear-gradient(135deg, var(--primary-400), var(--primary-300)); box-shadow: var(--shadow-glow); }
    .btn-secondary { background: var(--bg-elevated); color: var(--text-primary); border: 1px solid var(--border-default); }
    .btn-secondary:hover:not(:disabled) { border-color: var(--primary-500); color: var(--primary-500); }
    .btn-primary:disabled, .btn-secondary:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn-pay { width: 100%; margin-top: 0.5rem; }
    .help-pay { margin-top: 0.5rem; font-size: 0.82rem; color: var(--text-muted); text-align: center; }
    .btn-link { border: 0; background: transparent; color: var(--error); cursor: pointer; font-weight: 700; }
    .qr-result { margin-top: 1rem; display: grid; place-items: center; gap: 0.75rem; }
    .qr-result img { width: 220px; border-radius: var(--radius-sm); background: #ffffff; padding: 0.5rem; border: 2px solid var(--primary-500); }
    .qr-code { width: 100%; padding: 0.6rem; background: var(--bg-input); border-radius: var(--radius-sm); font-size: 0.75rem; color: var(--primary-500); overflow-wrap: anywhere; border: 1px solid rgba(255, 178, 0, 0.2); }
    .qr-detail { margin-top: 0.85rem; padding: 0.75rem; background: var(--bg-input); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 0.25rem; border: 1px solid var(--border-default); }
    .qr-preview { display: grid; place-items: center; margin-bottom: 0.5rem; }
    .qr-preview img { width: 180px; border-radius: var(--radius-sm); background: #ffffff; padding: 0.4rem; border: 2px solid var(--primary-500); }
    .qr-detail span { color: var(--text-secondary); font-size: 0.85rem; }
    .qr-detail.success { border: 1px solid rgba(34, 197, 94, 0.35); }
    .history { margin-top: 1rem; }
    .empty { color: var(--text-secondary); font-size: 0.9rem; }
    .qr-list { display: grid; gap: 0.6rem; }
    .qr-row { display: grid; grid-template-columns: 1fr auto auto; gap: 0.75rem; align-items: center; padding: 0.75rem; background: var(--bg-input); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); transition: border-color var(--transition-fast); }
    .qr-row:hover { border-color: rgba(255, 178, 0, 0.3); }
    .qr-row div { display: flex; flex-direction: column; }
    .qr-row span { color: var(--text-secondary); font-size: 0.82rem; }
    .badge { justify-self: start; }
    .msg-error { margin-top: 0.75rem; padding: 0.55rem 0.75rem; border-radius: var(--radius-sm); background: var(--error-bg); color: var(--error); font-size: 0.85rem; }
    @media (max-width: 900px) { .qr-grid { grid-template-columns: 1fr; } .qr-row { grid-template-columns: 1fr; } }
  `]
})
export class PagosQrPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  protected comercios = signal<any[]>([]);
  protected qrs = signal<any[]>([]);
  protected tipoQr = signal<'FIJO' | 'ABIERTO'>('ABIERTO');
  protected creating = signal(false);
  protected validating = signal(false);
  protected paying = signal(false);
  protected qrGenerado = signal<any>(null);
  protected qrValidado = signal<any>(null);
  protected pagoResultado = signal<any>(null);
  protected createError = signal('');
  protected payError = signal('');

  protected comercioId = '';
  protected montoSoles = 12;
  protected expiraMinutos = 30;
  protected codigoQr = '';
  protected montoPagoSoles = 10;

  ngOnInit(): void {
    this.cargarBase();
  }

  crearQr(): void {
    this.creating.set(true);
    this.createError.set('');
    const payload: any = {
      tipoQr: this.tipoQr()
    };
    if (this.tipoQr() === 'FIJO') {
      payload.comercioId = this.comercioId;
      payload.expiraMinutos = Number(this.expiraMinutos);
      payload.montoCentavos = Math.round(Number(this.montoSoles) * 100);
    }

    this.http.post<any>(`${environment.apiBaseUrl}/pagos-qr`, payload, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (data) => {
        this.qrGenerado.set(data);
        this.codigoQr = data.codigo_qr;
        this.creating.set(false);
        this.cargarQrs();
      },
      error: (err) => {
        this.createError.set(err?.error?.message || 'No se pudo generar el QR');
        this.creating.set(false);
      }
    });
  }

  validarQr(): void {
    this.validating.set(true);
    this.payError.set('');
    this.pagoResultado.set(null);
    this.http.post<any>(`${environment.apiBaseUrl}/pagos-qr/validar`, {
      codigoQr: this.codigoQr
    }, { headers: this.authService.getAuthHeaders() }).subscribe({
      next: (data) => {
        this.qrValidado.set(data);
        if (data.monto_centavos) {
          this.montoPagoSoles = data.monto_centavos / 100;
        }
        this.validating.set(false);
      },
      error: (err) => {
        this.payError.set(err?.error?.message || 'QR invalido');
        this.validating.set(false);
      }
    });
  }

  pagarQr(): void {
    if (!this.qrValidado() || this.qrValidado()?.estado !== 'PENDIENTE') {
      this.payError.set('Primero valida un QR en estado PENDIENTE');
      return;
    }
    this.paying.set(true);
    this.payError.set('');
    this.pagoResultado.set(null);
    this.http.post<any>(`${environment.apiBaseUrl}/pagos-qr/pagar`, {
      codigoQr: this.codigoQr,
      montoCentavos: Math.round(Number(this.montoPagoSoles) * 100)
    }, { headers: this.authService.getAuthHeaders() }).subscribe({
      next: (data) => {
        this.pagoResultado.set(data);
        this.paying.set(false);
        this.cargarQrs();
      },
      error: (err) => {
        this.payError.set(err?.error?.message || 'No se pudo pagar el QR');
        this.paying.set(false);
      }
    });
  }

  cancelar(id: string): void {
    this.http.post<any>(`${environment.apiBaseUrl}/pagos-qr/${id}/cancelar`, {}, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: () => this.cargarQrs(),
      error: () => {}
    });
  }

  private cargarBase(): void {
    const headers = this.authService.getAuthHeaders();
    this.http.get<any[]>(`${environment.apiBaseUrl}/pagos-qr/comercios`, { headers }).subscribe({
      next: (data) => {
        this.comercios.set(data);
        this.comercioId = data[0]?.id || '';
      },
      error: () => {}
    });
    this.cargarQrs();
    this.crearQr();
  }

  private cargarQrs(): void {
    this.http.get<any[]>(`${environment.apiBaseUrl}/pagos-qr`, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (data) => this.qrs.set(data),
      error: () => {}
    });
  }
}
