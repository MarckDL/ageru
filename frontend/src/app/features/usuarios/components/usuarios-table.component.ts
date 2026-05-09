import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Usuario } from '../models/usuario.model';

@Component({
  selector: 'app-usuarios-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <table *ngIf="usuarios.length; else emptyState">
      <thead>
        <tr>
          <th>DNI</th>
          <th>Nombre completo</th>
          <th>Telefono</th>
          <th>Estado</th>
          <th>Creado</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let usuario of usuarios">
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
        No hay usuarios registrados todavia.
      </div>
    </ng-template>
  `
})
export class UsuariosTableComponent {
  @Input({ required: true }) usuarios: Usuario[] = [];
}
