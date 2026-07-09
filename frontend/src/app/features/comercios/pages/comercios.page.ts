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
      <p class="page-subtitle">
        Registra negocios, valida RUC y revisa ventas por comercio.
      </p>

      <div class="grid">

        <!-- REGISTRO -->
        <section class="panel">
          <h2>Registrar comercio</h2>

          <div class="field">
            <label>RUC</label>
            <input [(ngModel)]="form.ruc" maxlength="11" />
          </div>

          <button
            type="button"
            class="btn btn-secondary"
            (click)="validarRUC()"
            [disabled]="validandoRUC()"
          >
            {{ validandoRUC() ? 'Validando...' : 'Validar RUC SUNAT' }}
          </button>

          <p class="msg-ok" *ngIf="rucValidado()">
            RUC validado por SUNAT
          </p>

          <div class="field">
            <label>Razón social</label>
            <input [(ngModel)]="form.razonSocial" />
          </div>

          <div class="field">
            <label>Nombre comercial</label>
            <input [(ngModel)]="form.nombreComercial" />
          </div>

          <div class="field">
            <label>Categoría</label>
            <input [(ngModel)]="form.categoria" placeholder="BODEGA, RESTAURANTE..." />
          </div>

          <div class="field">
            <label>Dirección fiscal</label>
            <input [(ngModel)]="form.direccionFiscal" />
          </div>

          <div class="field">
            <label>Teléfono contacto</label>
            <input [(ngModel)]="form.telefonoContacto" />
          </div>

          <button
            class="btn"
            (click)="crear()"
            [disabled]="saving()"
          >
            {{ saving() ? 'Guardando...' : 'Registrar' }}
          </button>

          <p class="msg-error" *ngIf="errorMsg()">
            {{ errorMsg() }}
          </p>
        </section>

        <!-- VENTAS -->
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

      <!-- LISTA -->
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
    .page {
      max-width: 1120px;
      animation: fadeIn 0.4s var(--transition-base);
    }

    .page-title {
      font-size: 1.6rem;
      font-weight: 700;
    }

    .page-subtitle {
      color: var(--text-secondary);
      margin-bottom: 1.5rem;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .panel {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 1rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      margin-bottom: 0.7rem;
    }

    .field label {
      color: var(--text-muted);
      font-size: 0.8rem;
    }

    .field input {
      padding: 0.6rem;
      background: var(--bg-input);
      color: var(--text-primary);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-sm);
    }

    .btn {
      width: 100%;
      padding: 0.7rem;
      border: none;
      border-radius: var(--radius-sm);
      background: var(--primary-600);
      color: #000;
      font-weight: 700;
      cursor: pointer;
    }

    .btn-secondary {
      background: var(--bg-input);
      color: var(--text-primary);
      border: 1px solid var(--border-default);
      margin-top: 0.3rem;
    }

    .msg-ok {
      color: var(--success);
      font-size: 0.85rem;
      margin-top: 0.5rem;
    }

    .msg-error {
      color: var(--error);
      margin-top: 0.75rem;
    }

    .rows {
      display: grid;
      gap: 0.6rem;
    }

    .row {
      display: flex;
      justify-content: space-between;
      padding: 0.7rem;
      background: var(--bg-input);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
    }

    .row span {
      color: var(--text-secondary);
      font-size: 0.85rem;
    }

    @media (max-width: 900px) {
      .grid {
        grid-template-columns: 1fr;
      }

      .row {
        flex-direction: column;
        gap: 0.3rem;
      }
    }
  `]
})
export class ComerciosPage implements OnInit {

  private http = inject(HttpClient);
  private auth = inject(AuthService);

  comercios = signal<any[]>([]);
  ventas = signal<any[]>([]);
  saving = signal(false);
  errorMsg = signal('');
  rucValidado = signal(false);
  validandoRUC = signal(false);

  form = {
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

  cargar(): void {
    this.http.get<any[]>(`${environment.apiBaseUrl}/comercios`, {
      headers: this.auth.getAuthHeaders()
    }).subscribe(res => this.comercios.set(res));

    this.http.get<any[]>(`${environment.apiBaseUrl}/comercios/reportes/ventas`, {
      headers: this.auth.getAuthHeaders()
    }).subscribe(res => this.ventas.set(res));
  }

  crear(): void {
    this.saving.set(true);
    this.errorMsg.set('');

    this.http.post(`${environment.apiBaseUrl}/comercios`, this.form, {
      headers: this.auth.getAuthHeaders()
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.form = {
          ruc: '',
          razonSocial: '',
          nombreComercial: '',
          categoria: '',
          direccionFiscal: '',
          telefonoContacto: ''
        };
        this.cargar();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMsg.set(err?.error?.message || 'Error al registrar comercio');
      }
    });
  }

  validarRUC(): void {
    const ruc = this.form.ruc.trim();

    if (ruc.length !== 11) {
      this.errorMsg.set('El RUC debe tener 11 dígitos');
      return;
    }

    this.validandoRUC.set(true);
    this.errorMsg.set('');
    this.rucValidado.set(false);

    this.http.get<any>(
      `${environment.apiBaseUrl}/comercios/validar-ruc/${ruc}`,
      { headers: this.auth.getAuthHeaders() }
    ).subscribe({
      next: (data) => {
        this.validandoRUC.set(false);

        if (data.estado !== 'ACTIVO') {
          this.errorMsg.set(`RUC ${data.estado}. Debe estar ACTIVO`);
          return;
        }

        this.form.razonSocial = data.razonSocial;
        this.form.direccionFiscal = data.direccion || '';
        this.rucValidado.set(true);
      },
      error: (err) => {
        this.validandoRUC.set(false);
        this.errorMsg.set(err?.error?.message || 'RUC no encontrado');
      }
    });
  }
}
