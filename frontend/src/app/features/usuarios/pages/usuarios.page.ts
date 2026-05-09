import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Usuario } from '../models/usuario.model';
import { UsuariosService } from '../services/usuarios.service';
import { UsuariosTableComponent } from '../components/usuarios-table.component';

@Component({
  standalone: true,
  selector: 'app-usuarios',
  imports: [CommonModule, UsuariosTableComponent],
  template: `
    <main class="page">
      <header class="page-header">
        <div>
          <h1>Usuarios</h1>
          <p class="subtitle">Lista de usuarios de Ageru_Chan.</p>
        </div>

        <div class="stats" *ngIf="usuarios().length">
          <span class="chip">Total: <strong>{{ usuarios().length }}</strong></span>
          <span class="chip" *ngIf="activos()">Activos: <strong>{{ activos() }}</strong></span>
        </div>
      </header>

      <section *ngIf="cargando()" class="state state-loading">Cargando usuarios...</section>
      <section *ngIf="error()" class="state state-error">{{ error() }}</section>

      <section *ngIf="!cargando() && !error()" class="table-wrapper">
        <app-usuarios-table [usuarios]="usuarios()"></app-usuarios-table>
      </section>
    </main>
  `,
  styles: [
    `
      .page { padding: 2rem; max-width: 1100px; margin: 0 auto; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #020617; }
      .page-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; margin-bottom: 1.5rem; }
      h1 { font-size: 1.75rem; font-weight: 600; margin: 0; }
      .subtitle { margin: 0.25rem 0 0; color: #64748b; font-size: 0.95rem; }
      .stats { display: flex; gap: 0.5rem; flex-wrap: wrap; }
      .chip { padding: 0.35rem 0.7rem; border-radius: 999px; background-color: #eff6ff; color: #1d4ed8; font-size: 0.85rem; }
      .state { border-radius: 0.75rem; padding: 0.75rem 1rem; font-size: 0.95rem; margin-top: 0.5rem; }
      .state-loading { background-color: #eff6ff; color: #1d4ed8; }
      .state-error { background-color: #fef2f2; color: #b91c1c; }
      .table-wrapper { margin-top: 1rem; border-radius: 0.75rem; border: 1px solid #e5e7eb; overflow: hidden; background-color: #ffffff; box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.08); }
      :host ::ng-deep table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
      :host ::ng-deep th, :host ::ng-deep td { padding: 0.6rem 0.9rem; text-align: left; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
      :host ::ng-deep th { background-color: #f9fafb; font-weight: 500; color: #4b5563; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; }
      :host ::ng-deep tr:nth-child(even) td { background-color: #f9fafb; }
      :host ::ng-deep .badge { display: inline-flex; align-items: center; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; background-color: #e5e7eb; color: #374151; }
      :host ::ng-deep .badge-activo { background-color: #dcfce7; color: #15803d; }
      :host ::ng-deep .state-empty { background-color: #f9fafb; color: #6b7280; text-align: center; border-radius: 0.75rem; padding: 0.75rem 1rem; }
      @media (max-width: 768px) {
        .page { padding: 1rem; }
        .page-header { flex-direction: column; align-items: flex-start; }
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
      error: () => {
        this.error.set('No se pudieron obtener los usuarios');
        this.cargando.set(false);
      }
    });
  }
}
