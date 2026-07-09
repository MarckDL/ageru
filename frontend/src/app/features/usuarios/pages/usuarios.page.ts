import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

interface Usuario {
  id: string;
  dni: string;
  telefono: string;
  nombres: string;
  apellidos: string;
  email: string | null;
  fecha_nacimiento: string;
  estado: string;
  created_at: string;
}

@Component({
  standalone: true,
  selector: 'app-usuarios-page',
  imports: [CommonModule],
  template: `
    <div class="usuarios-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Usuarios</h1>
          <p class="page-subtitle">Administración de usuarios registrados en Ageru.</p>
        </div>
        <div class="stats" *ngIf="usuarios().length">
          <span class="chip">Total: <strong>{{ usuarios().length }}</strong></span>
          <span class="chip chip-success">Activos: <strong>{{ activos() }}</strong></span>
        </div>
      </div>

      <div class="loading" *ngIf="cargando()">Cargando usuarios...</div>
      <div class="msg-error" *ngIf="error()">{{ error() }}</div>

      <div class="table-container" *ngIf="!cargando() && !error() && usuarios().length">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>DNI</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of usuarios()">
              <td class="name-cell">
                <div class="user-avatar-sm">{{ (u.nombres[0] + u.apellidos[0]).toUpperCase() }}</div>
                <span>{{ u.nombres }} {{ u.apellidos }}</span>
              </td>
              <td>{{ u.dni }}</td>
              <td>{{ u.telefono }}</td>
              <td class="email-cell">{{ u.email || '—' }}</td>
              <td>
                <span class="badge" [ngClass]="{
                  'badge-success': u.estado === 'ACTIVO',
                  'badge-warning': u.estado === 'PENDIENTE_VERIFICACION',
                  'badge-error': u.estado === 'BLOQUEADO'
                }">{{ u.estado }}</span>
              </td>
              <td class="actions-cell">
                <button class="action-btn"
                  (click)="toggleEstado(u)"
                  [title]="u.estado === 'ACTIVO' ? 'Bloquear' : 'Activar'"
                >
                  {{ u.estado === 'ACTIVO' ? '🔒' : '🔓' }}
                </button>
                <button class="action-btn action-danger"
                  (click)="eliminar(u)"
                  title="Eliminar (borrado lógico)"
                >
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="msg-success" *ngIf="successMsg()">{{ successMsg() }}</div>
    </div>
  `,
  styles: [`
    .usuarios-page {
      max-width: 1000px;
      animation: fadeIn 0.4s ease;
    }
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-end;
      gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;
    }
    .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
    .page-subtitle { color: var(--text-secondary); font-size: 0.9rem; }
    .stats { display: flex; gap: 0.5rem; }
    .chip {
      padding: 0.3rem 0.7rem; border-radius: var(--radius-full);
      background: rgba(255, 178, 0, 0.1); color: var(--primary-500);
      font-size: 0.82rem;
    }
    .chip-success {
      background: var(--success-bg); color: var(--success);
    }

    .loading { padding: 1rem; background: var(--info-bg); color: var(--info); border-radius: var(--radius-md); }
    .msg-error { padding: 0.75rem 1rem; background: var(--error-bg); color: var(--error); border-radius: var(--radius-md); }
    .msg-success { margin-top: 0.75rem; padding: 0.5rem 0.8rem; background: var(--success-bg); color: var(--success); border-radius: var(--radius-sm); font-size: 0.85rem; }

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
    tbody tr { transition: background var(--transition-fast); }
    tbody tr:hover { background: rgba(255, 178, 0, 0.04); }

    .name-cell {
      display: flex; align-items: center; gap: 0.6rem;
      color: var(--text-primary); font-weight: 500;
    }
    .user-avatar-sm {
      width: 30px; height: 30px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, var(--primary-600), var(--primary-500));
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 0.65rem; font-weight: 600; flex-shrink: 0;
    }
    .email-cell { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .badge { display: inline-flex; padding: 0.2rem 0.6rem; border-radius: var(--radius-full); font-size: 0.72rem; font-weight: 500; }
    .badge-success { background: var(--success-bg); color: var(--success); }
    .badge-warning { background: var(--warning-bg); color: var(--warning); }
    .badge-error { background: var(--error-bg); color: var(--error); }

    .actions-cell { display: flex; gap: 0.35rem; }
    .action-btn {
      padding: 0.35rem 0.5rem; border: 1px solid var(--border-default);
      border-radius: var(--radius-sm); background: transparent; cursor: pointer;
      font-size: 0.9rem; transition: all var(--transition-fast);
    }
    .action-btn:hover { background: var(--bg-card-hover); border-color: var(--primary-500); }
    .action-danger:hover { border-color: var(--error); background: var(--error-bg); }

    @media (max-width: 768px) {
      .table-container { overflow-x: auto; }
      .page-header { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class UsuariosPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly successMsg = signal('');

  protected readonly activos = computed(
    () => this.usuarios().filter((u) => u.estado === 'ACTIVO').length
  );

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  private cargarUsuarios(): void {
    this.cargando.set(true);
    this.error.set(null);
    const headers = this.authService.getAuthHeaders();

    this.http.get<Usuario[]>(`${environment.apiBaseUrl}/usuarios`, { headers }).subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron obtener los usuarios.');
        this.cargando.set(false);
      }
    });
  }

  toggleEstado(usuario: Usuario): void {
    const nuevoEstado = usuario.estado === 'ACTIVO' ? 'BLOQUEADO' : 'ACTIVO';
    const headers = this.authService.getAuthHeaders();

    this.http.patch<any>(
      `${environment.apiBaseUrl}/usuarios/${usuario.id}/estado`,
      { estado: nuevoEstado },
      { headers }
    ).subscribe({
      next: () => {
        this.successMsg.set(`Usuario ${usuario.nombres} ahora está ${nuevoEstado}.`);
        this.cargarUsuarios();
        setTimeout(() => this.successMsg.set(''), 3000);
      },
      error: () => {
        this.error.set('Error al cambiar estado del usuario.');
      }
    });
  }

  eliminar(usuario: Usuario): void {
    if (!confirm(`¿Eliminar (bloquear) a ${usuario.nombres} ${usuario.apellidos}?`)) return;
    const headers = this.authService.getAuthHeaders();

    this.http.delete<any>(
      `${environment.apiBaseUrl}/usuarios/${usuario.id}`,
      { headers }
    ).subscribe({
      next: () => {
        this.successMsg.set(`Usuario ${usuario.nombres} eliminado.`);
        this.cargarUsuarios();
        setTimeout(() => this.successMsg.set(''), 3000);
      },
      error: () => {
        this.error.set('Error al eliminar usuario.');
      }
    });
  }
}
