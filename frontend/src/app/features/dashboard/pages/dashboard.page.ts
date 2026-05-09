import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [RouterLink],
  template: `
    <main class="page">
      <h1>Dashboard</h1>
      <p>Vista privada despues del login.</p>
      <button type="button" (click)="logout()">Cerrar sesion</button>
      <p><a routerLink="/">Volver al inicio</a></p>
    </main>
  `,
  styles: [`.page { padding: 2rem; }`]
})
export class DashboardPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login')
    });
  }
}
