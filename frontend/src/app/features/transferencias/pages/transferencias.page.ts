import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-transferencias-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="transferencias-page">
      <h1 class="page-title">Transferencias</h1>
      <p class="page-subtitle">Envia dinero por telefono o por numero de cuenta.</p>

      <div class="transfer-grid">
        <section class="panel">
          <div class="mode-tabs">
            <button type="button" [class.active]="modo() === 'telefono'" (click)="modo.set('telefono')">
              Telefono
            </button>
            <button type="button" [class.active]="modo() === 'cuenta'" (click)="modo.set('cuenta')">
              Cuenta
            </button>
          </div>

          <div class="field" *ngIf="modo() === 'telefono'">
            <label for="telefono">Telefono destino</label>
            <input id="telefono" type="text" [(ngModel)]="telefono" placeholder="999222222" />
          </div>

          <div class="field" *ngIf="modo() === 'cuenta'">
            <label for="numeroCuenta">Numero de cuenta</label>
            <input id="numeroCuenta" type="text" [(ngModel)]="numeroCuenta" placeholder="***3333" />
          </div>

          <div class="field">
            <label for="monto">Monto en soles</label>
            <input id="monto" type="number" [(ngModel)]="montoSoles" min="0.01" step="0.01" />
          </div>

          <div class="field">
            <label for="descripcion">Descripcion</label>
            <input id="descripcion" type="text" [(ngModel)]="descripcion" maxlength="120" />
          </div>

          <button class="btn-primary" type="button" (click)="transferir()" [disabled]="loading()">
            {{ loading() ? 'Procesando...' : 'Transferir' }}
          </button>

          <p class="msg-error" *ngIf="errorMsg()">{{ errorMsg() }}</p>
        </section>

        <section class="panel result-panel" *ngIf="resultado()">
          <h2>Comprobante</h2>
          <div class="receipt-code">{{ resultado()?.comprobante?.codigo }}</div>
          <dl>
            <div>
              <dt>Monto</dt>
              <dd>S/ {{ resultado()?.comprobante?.montoSoles }}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{{ resultado()?.comprobante?.estado }}</dd>
            </div>
            <div>
              <dt>Tipo</dt>
              <dd>{{ resultado()?.comprobante?.tipo }}</dd>
            </div>
          </dl>
          <p class="msg-success">{{ resultado()?.notificacion?.mensaje }}</p>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .transferencias-page { max-width: 980px; animation: fadeIn 0.4s ease; }
    .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
    .page-subtitle { color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem; }
    .transfer-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr); gap: 1rem; align-items: start; }
    .panel { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.25rem; }
    .mode-tabs { display: inline-flex; background: var(--bg-input); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 0.2rem; margin-bottom: 1rem; }
    .mode-tabs button { border: 0; background: transparent; color: var(--text-secondary); padding: 0.45rem 0.8rem; border-radius: var(--radius-sm); font-family: inherit; cursor: pointer; }
    .mode-tabs button.active { background: var(--primary-600); color: #fff; }
    .field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.85rem; }
    .field label { font-size: 0.78rem; color: var(--text-muted); }
    .field input { padding: 0.65rem 0.75rem; background: var(--bg-input); border: 1px solid var(--border-default); border-radius: var(--radius-sm); color: var(--text-primary); font: inherit; outline: none; }
    .field input:focus { border-color: var(--primary-500); }
    .btn-primary { width: 100%; border: 0; border-radius: var(--radius-sm); padding: 0.75rem 1rem; background: linear-gradient(135deg, var(--primary-600), var(--primary-500)); color: #fff; font-weight: 700; font-family: inherit; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
    .result-panel h2 { font-size: 1.1rem; margin-bottom: 0.75rem; }
    .receipt-code { padding: 0.65rem; background: var(--bg-input); border: 1px dashed var(--border-strong); border-radius: var(--radius-sm); font-size: 0.82rem; color: var(--primary-300); overflow-wrap: anywhere; margin-bottom: 0.75rem; }
    dl div { display: flex; justify-content: space-between; gap: 1rem; padding: 0.45rem 0; border-bottom: 1px solid var(--border-subtle); }
    dt { color: var(--text-muted); font-size: 0.8rem; }
    dd { color: var(--text-primary); font-weight: 600; }
    .msg-success, .msg-error { margin-top: 0.75rem; padding: 0.55rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.85rem; }
    .msg-success { background: var(--success-bg); color: var(--success); }
    .msg-error { background: var(--error-bg); color: var(--error); }
    @media (max-width: 820px) { .transfer-grid { grid-template-columns: 1fr; } }
  `]
})
export class TransferenciasPage {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  protected modo = signal<'telefono' | 'cuenta'>('telefono');
  protected loading = signal(false);
  protected resultado = signal<any>(null);
  protected errorMsg = signal('');

  protected telefono = '';
  protected numeroCuenta = '';
  protected montoSoles = 10;
  protected descripcion = 'Transferencia Ageru';

  transferir(): void {
    this.loading.set(true);
    this.errorMsg.set('');
    this.resultado.set(null);

    const payload: any = {
      montoCentavos: Math.round(Number(this.montoSoles) * 100),
      descripcion: this.descripcion
    };
    if (this.modo() === 'telefono') {
      payload.telefono = this.telefono;
    } else {
      payload.numeroCuenta = this.numeroCuenta;
    }

    this.http.post<any>(`${environment.apiBaseUrl}/transacciones/transferir`, payload, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (data) => {
        this.resultado.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.message || 'No se pudo procesar la transferencia');
        this.loading.set(false);
      }
    });
  }
}
