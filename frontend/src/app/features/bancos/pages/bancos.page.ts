import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-bancos-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h1 class="page-title">Bancos</h1>
      <p class="page-subtitle">Catalogo de entidades y cuentas agrupadas por banco.</p>

      <section class="panel form">
        <div class="field"><label>Nombre</label><input [(ngModel)]="nombre" /></div>
        <div class="field"><label>Codigo Swift</label><input [(ngModel)]="codigoSwift" maxlength="11" /></div>
        <button class="btn" (click)="crear()">Registrar banco</button>
      </section>

      <div class="grid">
        <section class="panel">
          <h2>Catalogo</h2>
          <div class="row" *ngFor="let b of bancos()">
            <div><strong>{{ b.nombre }}</strong><span>{{ b.codigo_swift }} - {{ b.estado }}</span></div>
          </div>
        </section>
        <section class="panel">
          <h2>Cuentas por banco</h2>
          <div class="row" *ngFor="let r of reporte()">
            <div><strong>{{ r.nombre }}</strong><span>{{ r.cuentas }} cuentas</span></div>
            <strong>S/ {{ r.saldoSoles }}</strong>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1120px; animation: fadeIn 0.4s ease; }
    .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
    .page-subtitle { color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .panel { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1rem; margin-bottom: 1rem; }
    .form { display: grid; grid-template-columns: 1fr 0.6fr auto; gap: 0.75rem; align-items: end; }
    .field { display: flex; flex-direction: column; gap: 0.2rem; }
    .field label { color: var(--text-muted); font-size: 0.78rem; }
    .field input { padding: 0.6rem 0.7rem; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-default); border-radius: var(--radius-sm); font: inherit; }
    .btn { border: 0; border-radius: var(--radius-sm); padding: 0.68rem 1rem; background: var(--primary-600); color: #fff; font-weight: 700; cursor: pointer; }
    .row { display: flex; justify-content: space-between; gap: 1rem; padding: 0.7rem; background: var(--bg-input); border-radius: var(--radius-sm); margin-top: 0.55rem; }
    .row div { display: flex; flex-direction: column; }
    .row span { color: var(--text-secondary); font-size: 0.82rem; }
    @media (max-width: 900px) { .grid, .form { grid-template-columns: 1fr; } .row { flex-direction: column; } }
  `]
})
export class BancosPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  protected bancos = signal<any[]>([]);
  protected reporte = signal<any[]>([]);
  protected nombre = '';
  protected codigoSwift = '';

  ngOnInit(): void {
    this.cargar();
  }

  crear(): void {
    this.http.post(`${environment.apiBaseUrl}/bancos`, {
      nombre: this.nombre,
      codigoSwift: this.codigoSwift
    }, { headers: this.authService.getAuthHeaders() }).subscribe({
      next: () => {
        this.nombre = '';
        this.codigoSwift = '';
        this.cargar();
      },
      error: () => {}
    });
  }

  private cargar(): void {
    const headers = this.authService.getAuthHeaders();
    this.http.get<any[]>(`${environment.apiBaseUrl}/bancos`, { headers }).subscribe({ next: data => this.bancos.set(data), error: () => {} });
    this.http.get<any[]>(`${environment.apiBaseUrl}/bancos/reportes/cuentas`, { headers }).subscribe({ next: data => this.reporte.set(data), error: () => {} });
  }
}
