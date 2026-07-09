import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

interface PerfilData {
  id: string;
  dni: string;
  telefono: string;
  nombres: string;
  apellidos: string;
  email: string | null;
  fecha_nacimiento: string;
  estado: string;
  created_at: string;
  updated_at: string;
}

@Component({
  standalone: true,
  selector: 'app-perfil-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="perfil-page">
      <h1 class="page-title">Mi Perfil</h1>
      <p class="page-subtitle">Consulta y actualiza tus datos personales.</p>

      <div class="loading" *ngIf="loading()">Cargando perfil...</div>

      <div class="perfil-content" *ngIf="!loading() && perfil()">
        <div class="avatar-section">
          <div class="avatar-circle">
            {{ getInitials() }}
          </div>
          <div class="avatar-info">
            <h2>{{ perfil()?.nombres }} {{ perfil()?.apellidos }}</h2>
            <span class="badge" [ngClass]="{
              'badge-success': perfil()?.estado === 'ACTIVO',
              'badge-warning': perfil()?.estado === 'PENDIENTE_VERIFICACION',
              'badge-error': perfil()?.estado === 'BLOQUEADO'
            }">{{ perfil()?.estado }}</span>
          </div>
        </div>

        <!-- Info cards -->
        <div class="info-grid">
          <div class="info-card">
            <span class="info-label">DNI</span>
            <span class="info-value">{{ perfil()?.dni }}</span>
          </div>
          <div class="info-card">
            <span class="info-label">Teléfono</span>
            <span class="info-value">{{ perfil()?.telefono }}</span>
          </div>
          <div class="info-card">
            <span class="info-label">Email</span>
            <span class="info-value">{{ perfil()?.email || 'No registrado' }}</span>
          </div>
          <div class="info-card">
            <span class="info-label">Fecha de nacimiento</span>
            <span class="info-value">{{ perfil()?.fecha_nacimiento | date:'dd/MM/yyyy' }}</span>
          </div>
          <div class="info-card">
            <span class="info-label">Miembro desde</span>
            <span class="info-value">{{ perfil()?.created_at | date:'dd/MM/yyyy' }}</span>
          </div>
        </div>

        <!-- Edit Form -->
        <div class="edit-section">
          <h3>Actualizar datos</h3>
          <form class="edit-form" (ngSubmit)="guardar()" #editForm="ngForm">
            <div class="form-row">
              <div class="field">
                <label for="edit-nombres">Nombres</label>
                <input id="edit-nombres" name="nombres" [(ngModel)]="editModel.nombres" required />
              </div>
              <div class="field">
                <label for="edit-apellidos">Apellidos</label>
                <input id="edit-apellidos" name="apellidos" [(ngModel)]="editModel.apellidos" required />
              </div>
            </div>
            <div class="field">
              <label for="edit-fecha">Fecha de nacimiento</label>
              <input id="edit-fecha" type="date" name="fechaNacimiento" [(ngModel)]="editModel.fechaNacimiento" required />
            </div>
            <button type="submit" class="btn-save" [disabled]="saving() || editForm.invalid">
              {{ saving() ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </form>
          <div class="msg-success" *ngIf="successMsg()">{{ successMsg() }}</div>
          <div class="msg-error" *ngIf="errorMsg()">{{ errorMsg() }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .perfil-page {
      max-width: 800px;
      animation: fadeIn 0.4s ease;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    .page-subtitle {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }
    .loading {
      padding: 1rem;
      background: var(--info-bg);
      color: var(--info);
      border-radius: var(--radius-md);
    }

    .avatar-section {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .avatar-circle {
      width: 64px;
      height: 64px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, var(--primary-600), var(--primary-400));
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .avatar-info h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.3rem;
    }

    .badge {
      display: inline-flex;
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 500;
    }
    .badge-success { background: var(--success-bg); color: var(--success); }
    .badge-warning { background: var(--warning-bg); color: var(--warning); }
    .badge-error { background: var(--error-bg); color: var(--error); }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.75rem;
      margin-bottom: 2rem;
    }
    .info-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1rem;
    }
    .info-label {
      display: block;
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 0.3rem;
    }
    .info-value {
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .edit-section {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
    }
    .edit-section h3 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
    .edit-form {
      display: grid;
      gap: 0.9rem;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    .field label {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-secondary);
    }
    .field input {
      padding: 0.6rem 0.8rem;
      background: var(--bg-input);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      font-size: 0.9rem;
      font-family: inherit;
      outline: none;
      transition: border-color var(--transition-fast);
    }
    .field input:focus {
      border-color: var(--primary-500);
      box-shadow: 0 0 0 3px rgba(255, 178, 0, 0.15);
    }
    .btn-save {
      padding: 0.7rem 1.5rem;
      background: linear-gradient(135deg, var(--primary-600), var(--primary-500));
      color: #fff;
      border: none;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all var(--transition-fast);
      width: fit-content;
    }
    .btn-save:hover:not(:disabled) {
      background: linear-gradient(135deg, var(--primary-500), var(--primary-400));
      box-shadow: var(--shadow-glow);
    }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

    .msg-success {
      margin-top: 0.75rem;
      padding: 0.5rem 0.8rem;
      background: var(--success-bg);
      color: var(--success);
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
    }
    .msg-error {
      margin-top: 0.75rem;
      padding: 0.5rem 0.8rem;
      background: var(--error-bg);
      color: var(--error);
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
    }

    @media (max-width: 500px) {
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class PerfilPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  protected perfil = signal<PerfilData | null>(null);
  protected loading = signal(true);
  protected saving = signal(false);
  protected successMsg = signal('');
  protected errorMsg = signal('');
  protected editModel = { nombres: '', apellidos: '', fechaNacimiento: '' };

  ngOnInit(): void {
    this.cargarPerfil();
  }

  getInitials(): string {
    const p = this.perfil();
    if (!p) return 'U';
    return ((p.nombres?.[0] || '') + (p.apellidos?.[0] || '')).toUpperCase();
  }

  private cargarPerfil(): void {
    const headers = this.authService.getAuthHeaders();
    this.http.get<PerfilData>(`${environment.apiBaseUrl}/usuarios/perfil`, { headers }).subscribe({
      next: (data) => {
        this.perfil.set(data);
        this.editModel.nombres = data.nombres;
        this.editModel.apellidos = data.apellidos;
        this.editModel.fechaNacimiento = data.fecha_nacimiento
          ? data.fecha_nacimiento.substring(0, 10)
          : '';
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  guardar(): void {
    this.saving.set(true);
    this.successMsg.set('');
    this.errorMsg.set('');
    const headers = this.authService.getAuthHeaders();
    this.http.put<PerfilData>(`${environment.apiBaseUrl}/usuarios/perfil`, this.editModel, { headers }).subscribe({
      next: (data) => {
        this.perfil.set(data);
        this.saving.set(false);
        this.successMsg.set('Perfil actualizado correctamente.');
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMsg.set(err?.error?.message || 'Error al actualizar perfil.');
      }
    });
  }
}
