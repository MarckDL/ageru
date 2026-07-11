import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

interface Contacto {
  contacto_usuario_id: string;
  dni: string;
  telefono: string;
  nombres: string;
  apellidos: string;
  email: string | null;
  estado: string;
  created_at: string;
  alias: string | null;
  es_favorito: boolean;
  es_reciente: boolean;
  ultimo_contacto_at: string | null;
  numero_cuenta_enmascarado: string | null;
  banco_nombre: string | null;
}

@Component({
  standalone: true,
  selector: 'app-usuarios-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="usuarios-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Contactos y favoritos</h1>
          <p class="page-subtitle">Busca personas por teléfono o cuenta y guárdalas para transferencias rápidas.</p>
        </div>
        <div class="stats" *ngIf="contactos().length">
          <span class="chip">Resultados: <strong>{{ contactos().length }}</strong></span>
          <span class="chip chip-success">Favoritos: <strong>{{ favoritos() }}</strong></span>
        </div>
      </div>

      <section class="panel search-panel">
        <div class="field">
          <label for="q">Buscar por teléfono, cuenta, nombre o correo</label>
          <input
            id="q"
            [(ngModel)]="searchTerm"
            placeholder="999111222 o ***AB12"
            (keyup.enter)="buscar()"
          />
        </div>
        <button class="btn" type="button" (click)="buscar()" [disabled]="cargando()">
          {{ cargando() ? 'Buscando...' : 'Buscar' }}
        </button>
      </section>

      <p class="helper-copy" *ngIf="!isBusquedaActiva()">
        Aquí ves tus contactos guardados y los que usaste recientemente en transferencias.
      </p>

      <div class="loading" *ngIf="cargando()">Cargando contactos...</div>
      <div class="msg-error" *ngIf="error()">{{ error() }}</div>

      <div *ngIf="!cargando() && !isBusquedaActiva()">
        <section class="section-block">
          <h2>Guardados</h2>
          <div class="cards" *ngIf="guardados().length; else emptyGuardados">
            <article class="contact-card" *ngFor="let c of guardados()">
              <ng-container *ngTemplateOutlet="contactoCard; context: { $implicit: c }"></ng-container>
            </article>
          </div>
          <ng-template #emptyGuardados>
            <div class="empty-inline">No tienes contactos guardados todavía.</div>
          </ng-template>
        </section>

        <section class="section-block">
          <h2>Recientes</h2>
          <div class="cards" *ngIf="recientes().length; else emptyRecientes">
            <article class="contact-card" *ngFor="let c of recientes()">
              <ng-container *ngTemplateOutlet="contactoCard; context: { $implicit: c }"></ng-container>
            </article>
          </div>
          <ng-template #emptyRecientes>
            <div class="empty-inline">Aún no hay transferencias recientes para mostrar.</div>
          </ng-template>
        </section>
      </div>

      <div *ngIf="!cargando() && isBusquedaActiva()">
        <h2 class="results-title">Resultados</h2>
        <div class="cards" *ngIf="contactos().length; else emptyBusqueda">
          <article class="contact-card" *ngFor="let c of contactos()">
            <ng-container *ngTemplateOutlet="contactoCard; context: { $implicit: c }"></ng-container>
          </article>
        </div>
        <ng-template #emptyBusqueda>
          <div class="empty-state">No encontramos contactos con ese criterio.</div>
        </ng-template>
      </div>

      <div class="msg-success" *ngIf="successMsg()">{{ successMsg() }}</div>

      <ng-template #contactoCard let-c>
        <div class="contact-main">
          <div class="user-avatar-sm">{{ getInitials(c) }}</div>
          <div class="contact-info">
            <div class="contact-title">
              <strong>{{ c.alias || (c.nombres + ' ' + c.apellidos) }}</strong>
              <span class="badge" [ngClass]="{
                'badge-success': c.es_favorito,
                'badge-warning': !c.es_favorito && c.es_reciente
              }">{{ c.es_favorito ? 'Guardado' : (c.es_reciente ? 'Reciente' : 'Disponible') }}</span>
            </div>
            <span>{{ c.telefono }}</span>
            <span>{{ c.numero_cuenta_enmascarado || 'Sin cuenta visible' }}</span>
            <span>{{ c.banco_nombre || 'Sin banco vinculado' }}</span>
          </div>
        </div>

        <div class="contact-meta">
          <span>Estado: {{ c.estado }}</span>
          <span>Email: {{ c.email || '—' }}</span>
        </div>

        <div class="contact-actions">
          <button class="action-btn" type="button" (click)="guardarFavorito(c)">
            {{ c.es_favorito ? 'Actualizar' : 'Guardar' }}
          </button>
          <button class="action-btn action-primary" type="button" (click)="irTransferencia(c)">
            Transferir
          </button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .usuarios-page {
      max-width: 1100px;
      animation: fadeIn 0.4s ease;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 1rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
    .page-subtitle { color: var(--text-secondary); font-size: 0.9rem; }
    .stats { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .chip {
      padding: 0.3rem 0.7rem;
      border-radius: var(--radius-full);
      background: rgba(255, 178, 0, 0.1);
      color: var(--primary-500);
      font-size: 0.82rem;
    }
    .chip-success {
      background: var(--success-bg);
      color: var(--success);
    }
    .panel {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 1rem;
    }
    .search-panel {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 0.75rem;
      align-items: end;
      margin-bottom: 1rem;
    }
    .helper-copy {
      color: var(--text-secondary);
      font-size: 0.84rem;
      margin: 0 0 0.75rem;
    }
    .section-block {
      margin-top: 1.25rem;
    }
    .section-block h2, .results-title {
      font-size: 1.05rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .field label { color: var(--text-muted); font-size: 0.78rem; }
    .field input {
      padding: 0.65rem 0.75rem;
      background: var(--bg-input);
      color: var(--text-primary);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-sm);
      font: inherit;
    }
    .btn {
      border: 0;
      border-radius: var(--radius-sm);
      padding: 0.7rem 1rem;
      background: var(--primary-600);
      color: #fff;
      font-weight: 700;
      cursor: pointer;
    }
    .loading, .empty-state, .msg-error, .msg-success {
      padding: 0.8rem 1rem;
      border-radius: var(--radius-md);
      margin-top: 0.75rem;
    }
    .loading { background: var(--info-bg); color: var(--info); }
    .msg-error { background: var(--error-bg); color: var(--error); }
    .msg-success { background: var(--success-bg); color: var(--success); }
    .empty-state {
      text-align: center;
      color: var(--text-secondary);
      background: var(--bg-card);
      border: 1px dashed var(--border-subtle);
    }
    .empty-inline {
      padding: 0.8rem 1rem;
      background: var(--bg-input);
      border: 1px dashed var(--border-subtle);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .contact-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 1rem;
      display: grid;
      gap: 0.9rem;
      box-shadow: var(--shadow-sm);
    }
    .contact-main {
      display: flex;
      gap: 0.8rem;
      align-items: flex-start;
    }
    .user-avatar-sm {
      width: 38px;
      height: 38px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, var(--primary-600), var(--primary-500));
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .contact-info {
      display: grid;
      gap: 0.2rem;
      min-width: 0;
    }
    .contact-title {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .contact-info span {
      color: var(--text-secondary);
      font-size: 0.85rem;
      overflow-wrap: anywhere;
    }
    .contact-meta {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      color: var(--text-muted);
      font-size: 0.8rem;
    }
    .contact-actions {
      display: flex;
      gap: 0.5rem;
    }
    .action-btn {
      flex: 1;
      padding: 0.6rem 0.8rem;
      border: 1px solid var(--border-default);
      border-radius: var(--radius-sm);
      background: var(--bg-elevated);
      color: var(--text-primary);
      cursor: pointer;
      font-weight: 600;
    }
    .action-primary {
      background: linear-gradient(135deg, var(--primary-600), var(--primary-500));
      color: #fff;
      border: none;
    }
    .badge {
      display: inline-flex;
      padding: 0.2rem 0.55rem;
      border-radius: var(--radius-full);
      font-size: 0.72rem;
      font-weight: 600;
    }
    .badge-success { background: var(--success-bg); color: var(--success); }
    .badge-warning { background: var(--warning-bg); color: var(--warning); }

    @media (max-width: 720px) {
      .search-panel { grid-template-columns: 1fr; }
      .contact-actions { flex-direction: column; }
      .contact-meta { flex-direction: column; gap: 0.4rem; }
    }
  `]
})
export class UsuariosPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly contactos = signal<Contacto[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly successMsg = signal('');
  protected searchTerm = '';

  protected readonly favoritos = computed(
    () => this.contactos().filter((c) => c.es_favorito).length
  );
  protected readonly guardados = computed(
    () => this.contactos().filter((c) => c.es_favorito)
  );
  protected readonly recientes = computed(
    () => this.contactos().filter((c) => c.es_reciente && !c.es_favorito)
  );
  isBusquedaActiva(): boolean {
    return !!this.searchTerm.trim();
  }

  ngOnInit(): void {
    void this.buscar();
  }

  protected getInitials(contacto: Contacto): string {
    const nombre = contacto.alias || `${contacto.nombres} ${contacto.apellidos}`;
    const parts = nombre.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }

  async buscar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);

    try {
      const headers = this.authService.getAuthHeaders();
      const data = await firstValueFrom(
        this.http.get<Contacto[]>(`${environment.apiBaseUrl}/usuarios/contactos`, {
          headers,
          params: this.searchTerm.trim() ? { q: this.searchTerm.trim() } : {}
        })
      );
      this.contactos.set(data || []);
    } catch {
      this.error.set('No se pudieron obtener los contactos.');
    } finally {
      this.cargando.set(false);
    }
  }

  guardarFavorito(contacto: Contacto): void {
    this.successMsg.set('');
    this.http.post<any>(
      `${environment.apiBaseUrl}/usuarios/contactos`,
      {
        contactoUsuarioId: contacto.contacto_usuario_id,
        esFavorito: true
      },
      { headers: this.authService.getAuthHeaders() }
    ).subscribe({
      next: () => {
        this.successMsg.set(`${contacto.alias || `${contacto.nombres} ${contacto.apellidos}`} guardado en contactos.`);
        void this.buscar();
        setTimeout(() => this.successMsg.set(''), 2500);
      },
      error: () => {
        this.error.set('No se pudo guardar el contacto.');
      }
    });
  }

  irTransferencia(contacto: Contacto): void {
    this.router.navigate(['/dashboard/transferencias'], {
      queryParams: contacto.telefono ? { telefono: contacto.telefono } : { numeroCuenta: contacto.numero_cuenta_enmascarado }
    });
  }
}
