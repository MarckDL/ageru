import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuariosService, Usuario } from './usuarios.service';

@Component({
  standalone: true,
  selector: 'app-usuarios',
  imports: [CommonModule],
  template: `
    <main class="page">
      <header class="page-header">
        <div>
          <h1>Usuarios</h1>
          <p class="subtitle">
            Lista de usuarios de Ageru_Chan (maqueta estilo Yape).
          </p>
        </div>

        <div class="stats" *ngIf="usuarios().length">
          <span class="chip">
            Total: <strong>{{ usuarios().length }}</strong>
          </span>
          <span class="chip" *ngIf="activos()">
            Activos: <strong>{{ activos() }}</strong>
          </span>
        </div>
      </header>

      <section *ngIf="cargando()" class="state state-loading">
        Cargando usuarios...
      </section>

      <section *ngIf="error()" class="state state-error">
        {{ error() }}
      </section>

      <section *ngIf="!cargando() && !error()" class="table-wrapper">
        <table *ngIf="usuarios().length; else emptyState">
          <thead>
            <tr>
              <th>DNI</th>
              <th>Nombre completo</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th>Creado</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let usuario of usuarios()">
              <td>{{ usuario.dni }}</td>
              <td>{{ usuario.nombres }} {{ usuario.apellidos }}</td>
              <td>{{ usuario.telefono }}</td>
              <td>
                <span class="badge" [class.badge-activo]="usuario.estado === 'ACTIVO'">
                  {{ usuario.estado }}
                </span>
              </td>
              <td>{{ usuario.created_at | date: 'yyyy-MM-dd HH:mm' }}</td>
            </tr>
          </tbody>
        </table>

        <ng-template #emptyState>
          <div class="state state-empty">
            No hay usuarios registrados todavía.
          </div>
        </ng-template>
      </section>
    </main>
  `,
  styles: [
    `
      .page {
        padding: 2rem;
        max-width: 1100px;
        margin: 0 auto;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #020617;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      h1 {
        font-size: 1.75rem;
        font-weight: 600;
        margin: 0;
      }

      .subtitle {
        margin: 0.25rem 0 0;
        color: #64748b;
        font-size: 0.95rem;
      }

      .stats {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .chip {
        padding: 0.35rem 0.7rem;
        border-radius: 999px;
        background-color: #eff6ff;
        color: #1d4ed8;
        font-size: 0.85rem;
      }

      .state {
        border-radius: 0.75rem;
        padding: 0.75rem 1rem;
        font-size: 0.95rem;
        margin-top: 0.5rem;
      }

      .state-loading {
        background-color: #eff6ff;
        color: #1d4ed8;
      }

      .state-error {
        background-color: #fef2f2;
        color: #b91c1c;
      }

      .state-empty {
        background-color: #f9fafb;
        color: #6b7280;
        text-align: center;
      }

      .table-wrapper {
        margin-top: 1rem;
        border-radius: 0.75rem;
        border: 1px solid #e5e7eb;
        overflow: hidden;
        background-color: #ffffff;
        box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.08);
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
      }

      th,
      td {
        padding: 0.6rem 0.9rem;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
        white-space: nowrap;
      }

      th {
        background-color: #f9fafb;
        font-weight: 500;
        color: #4b5563;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      tr:nth-child(even) td {
        background-color: #f9fafb;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        font-size: 0.75rem;
        background-color: #e5e7eb;
        color: #374151;
      }

      .badge-activo {
        background-color: #dcfce7;
        color: #15803d;
      }

      @media (max-width: 768px) {
        .page {
          padding: 1rem;
        }

        .page-header {
          flex-direction: column;
          align-items: flex-start;
        }

        th:nth-child(5),
        td:nth-child(5) {
          display: none;
        }
      }
    `
  ]
})
export class UsuariosPage implements OnInit {
  private readonly usuariosService = inject(UsuariosService);

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly cargando = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  protected readonly activos = computed(
    () => this.usuarios().filter((u) => u.estado === 'ACTIVO').length
  );

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  private cargarUsuarios(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.usuariosService.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('No se pudieron obtener los usuarios');
        this.cargando.set(false);
      }
    });
  }
}

