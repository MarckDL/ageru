import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-dispositivos-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h1 class="page-title">Dispositivos</h1>
      <p class="page-subtitle">Gestiona los equipos autorizados para acceder a tu cuenta.</p>

      <section class="panel form">
        <div class="field"><label>Token dispositivo</label><input [(ngModel)]="tokenDispositivo" /></div>
        <div class="field">
          <label>Sistema</label>
          <select [(ngModel)]="tipoOs"><option value="ANDROID">ANDROID</option><option value="IOS">IOS</option></select>
        </div>
        <div class="field"><label>Nombre</label><input [(ngModel)]="nombreDispositivo" /></div>
        <button class="btn" (click)="registrar()">Registrar</button>
      </section>

      <section class="panel">
        <h2>Mis dispositivos</h2>
        <div class="row" *ngFor="let d of dispositivos()">
          <div><strong>{{ d.nombre_dispositivo || d.tipo_os }}</strong><span>{{ d.token_dispositivo }}</span></div>
          <button class="btn-link" *ngIf="d.activo" (click)="desactivar(d.id)">Desactivar</button>
          <span *ngIf="!d.activo">Inactivo</span>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { max-width: 900px; animation: fadeIn 0.4s ease; }
    .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
    .page-subtitle { color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem; }
    .panel { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1rem; margin-bottom: 1rem; }
    .form { display: grid; grid-template-columns: 1.5fr 0.7fr 1fr auto; gap: 0.75rem; align-items: end; }
    .field { display: flex; flex-direction: column; gap: 0.2rem; }
    .field label { color: var(--text-muted); font-size: 0.78rem; }
    .field input, .field select { padding: 0.6rem 0.7rem; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-default); border-radius: var(--radius-sm); font: inherit; }
    .btn { border: 0; border-radius: var(--radius-sm); padding: 0.68rem 1rem; background: var(--primary-600); color: #fff; font-weight: 700; cursor: pointer; }
    .row { display: flex; justify-content: space-between; gap: 1rem; padding: 0.7rem; background: var(--bg-input); border-radius: var(--radius-sm); margin-top: 0.55rem; }
    .row div { display: flex; flex-direction: column; min-width: 0; }
    .row span { color: var(--text-secondary); font-size: 0.82rem; overflow-wrap: anywhere; }
    .btn-link { border: 0; background: transparent; color: var(--error); font-weight: 700; cursor: pointer; }
    @media (max-width: 800px) { .form { grid-template-columns: 1fr; } .row { flex-direction: column; } }
  `]
})
export class DispositivosPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  protected dispositivos = signal<any[]>([]);
  protected tokenDispositivo = `web-${Date.now()}`;
  protected tipoOs = 'ANDROID';
  protected nombreDispositivo = 'Navegador web';

  ngOnInit(): void {
    this.cargar();
  }

  registrar(): void {
    this.http.post(`${environment.apiBaseUrl}/dispositivos`, {
      tokenDispositivo: this.tokenDispositivo,
      tipoOs: this.tipoOs,
      nombreDispositivo: this.nombreDispositivo
    }, { headers: this.authService.getAuthHeaders() }).subscribe({ next: () => this.cargar(), error: () => {} });
  }

  desactivar(id: string): void {
    this.http.patch(`${environment.apiBaseUrl}/dispositivos/${id}/desactivar`, {}, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({ next: () => this.cargar(), error: () => {} });
  }

  private cargar(): void {
    this.http.get<any[]>(`${environment.apiBaseUrl}/dispositivos`, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({ next: data => this.dispositivos.set(data), error: () => {} });
  }
}
