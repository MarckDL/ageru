import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-comercios-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h1 class="page-title">Comercios</h1>
      <p class="page-subtitle">Registra negocios, valida RUC y revisa ventas por comercio.</p>

      <div class="grid">
        <section class="panel">
          <h2>Registrar comercio</h2>
          <div class="field"><label>RUC</label><input [(ngModel)]="form.ruc" maxlength="11" /></div>
          <div class="field"><label>Razon social</label><input [(ngModel)]="form.razonSocial" /></div>
          <div class="field"><label>Nombre comercial</label><input [(ngModel)]="form.nombreComercial" /></div>
          <div class="field"><label>Categoria</label><input [(ngModel)]="form.categoria" placeholder="BODEGA, RESTAURANTE..." /></div>
          <div class="field"><label>Direccion fiscal</label><input [(ngModel)]="form.direccionFiscal" /></div>
          <div class="field"><label>Telefono contacto</label><input [(ngModel)]="form.telefonoContacto" /></div>
          <button class="btn" (click)="crear()" [disabled]="saving()">{{ saving() ? 'Guardando...' : 'Registrar' }}</button>
          <p class="msg-error" *ngIf="errorMsg()">{{ errorMsg() }}</p>
        </section>

        <section class="panel">
          <h2>Reporte de ventas</h2>
          <div class="rows">
            <div class="row" *ngFor="let r of ventas()">
              <div>
                <strong>{{ r.nombre_comercial || r.razon_social }}</strong>
                <span>{{ r.ruc }} - {{ r.cantidad_ventas }} ventas</span>
              </div>
              <strong>S/ {{ r.ventasSoles }}</strong>
            </div>
          </div>
        </section>
      </div>

      <section class="panel list">
        <h2>Mis comercios</h2>
        <div class="rows">
          <div class="row" *ngFor="let c of comercios()">
            <div>
              <strong>{{ c.nombre_comercial || c.razon_social }}</strong>
              <span>{{ c.ruc }} - {{ c.categoria }} - {{ c.estado }}</span>
            </div>
            <span>{{ c.numero_cuenta_enmascarado || 'Cuenta asociada' }}</span>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { max-width: 1120px; animation: fadeIn 0.4s ease; }
    .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
    .page-subtitle { color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start; }
    .panel { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1rem; }
    .panel h2 { font-size: 1.05rem; margin-bottom: 0.8rem; }
    .field { display: flex; flex-direction: column; gap: 0.2rem; margin-bottom: 0.7rem; }
    .field label { color: var(--text-muted); font-size: 0.78rem; }
    .field input { padding: 0.6rem 0.7rem; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-default); border-radius: var(--radius-sm); font: inherit; }
    .btn { width: 100%; border: 0; border-radius: var(--radius-sm); padding: 0.7rem; background: var(--primary-600); color: #fff; font-weight: 700; cursor: pointer; }
    .list { margin-top: 1rem; }
    .rows { display: grid; gap: 0.55rem; }
    .row { display: flex; justify-content: space-between; gap: 1rem; padding: 0.7rem; background: var(--bg-input); border-radius: var(--radius-sm); }
    .row div { display: flex; flex-direction: column; }
    .row span { color: var(--text-secondary); font-size: 0.85rem; }
    .msg-error { margin-top: 0.75rem; color: var(--error); }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } .row { flex-direction: column; } }
  `]
})
export class ComerciosPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  protected comercios = signal<any[]>([]);
  protected ventas = signal<any[]>([]);
  protected saving = signal(false);
  protected errorMsg = signal('');

  protected form = {
    ruc: '',
    razonSocial: '',
    nombreComercial: '',
    categoria: '',
    direccionFiscal: '',
    telefonoContacto: ''
  };

  ngOnInit(): void {
    this.cargar();
  }

  crear(): void {
    this.saving.set(true);
    this.errorMsg.set('');
    this.http.post(`${environment.apiBaseUrl}/comercios`, this.form, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.form = { ruc: '', razonSocial: '', nombreComercial: '', categoria: '', direccionFiscal: '', telefonoContacto: '' };
        this.cargar();
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.message || 'No se pudo registrar el comercio');
        this.saving.set(false);
      }
    });
  }

  private cargar(): void {
    const headers = this.authService.getAuthHeaders();
    this.http.get<any[]>(`${environment.apiBaseUrl}/comercios`, { headers }).subscribe({ next: data => this.comercios.set(data), error: () => {} });
    this.http.get<any[]>(`${environment.apiBaseUrl}/comercios/reportes/ventas`, { headers }).subscribe({ next: data => this.ventas.set(data), error: () => {} });
  }
}
