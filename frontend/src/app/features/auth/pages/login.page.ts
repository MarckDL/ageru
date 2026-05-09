import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  AuthService,
  RegisterPayload
} from '../../../core/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [RouterLink, FormsModule, CommonModule],
  template: `
    <main class="page">
      <h1>Acceso</h1>
      <p>Inicia sesion si ya tienes cuenta o registrate si aun no la tienes.</p>

      <div class="tabs">
        <button type="button" [class.active]="mode === 'login'" (click)="setMode('login')">
          Iniciar sesion
        </button>
        <button type="button" [class.active]="mode === 'register'" (click)="setMode('register')">
          Registrarme
        </button>
      </div>

      <form class="form" *ngIf="mode === 'login'" (ngSubmit)="login()" #loginForm="ngForm">
        <label>
          Usuario
          <input
            name="username"
            [(ngModel)]="username"
            placeholder="admin"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            [(ngModel)]="password"
            placeholder="admin123"
            required
          />
        </label>

        <button type="submit" [disabled]="loading || loginForm.invalid">
          {{ loading ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>

      <form
        class="form"
        *ngIf="mode === 'register'"
        (ngSubmit)="register()"
        #registerForm="ngForm"
      >
        <label>
          Usuario
          <input name="regUsername" [(ngModel)]="registerModel.username" required />
        </label>
        <label>
          Password
          <input
            type="password"
            name="regPassword"
            [(ngModel)]="registerModel.password"
            required
            minlength="6"
          />
        </label>
        <label>
          DNI
          <input name="dni" [(ngModel)]="registerModel.dni" required minlength="8" maxlength="8" />
        </label>
        <label>
          Telefono
          <input name="telefono" [(ngModel)]="registerModel.telefono" required />
        </label>
        <label>
          Nombres
          <input name="nombres" [(ngModel)]="registerModel.nombres" required />
        </label>
        <label>
          Apellidos
          <input name="apellidos" [(ngModel)]="registerModel.apellidos" required />
        </label>
        <label>
          Email (opcional)
          <input name="email" [(ngModel)]="registerModel.email" />
        </label>
        <label>
          Fecha de nacimiento
          <input
            type="date"
            name="fechaNacimiento"
            [(ngModel)]="registerModel.fechaNacimiento"
            required
          />
        </label>
        <button type="submit" [disabled]="loading || registerForm.invalid">
          {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
        </button>
      </form>

      <p class="help" *ngIf="mode === 'login'">
        Si no tienes cuenta, usa la pestaña "Registrarme".
      </p>
      <p class="help" *ngIf="mode === 'register'">
        Luego de registrar, te cambiamos automaticamente a login.
      </p>
      <p class="error" *ngIf="error">{{ error }}</p>
      <p class="success" *ngIf="success">{{ success }}</p>
      <p><a routerLink="/">Volver al inicio</a></p>
    </main>
  `,
  styles: [
    `
      .page { padding: 2rem; max-width: 480px; margin: 0 auto; }
      .form { display: grid; gap: 0.75rem; margin-top: 1rem; }
      label { display: grid; gap: 0.4rem; font-size: 0.9rem; }
      input { padding: 0.55rem 0.7rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; }
      button { margin-top: 0.25rem; padding: 0.6rem 0.8rem; border: none; border-radius: 0.5rem; background: #2563eb; color: #fff; cursor: pointer; }
      button:disabled { opacity: 0.6; cursor: not-allowed; }
      .tabs { display: flex; gap: 0.5rem; margin: 0.8rem 0 0.2rem; }
      .tabs button { flex: 1; background: #e2e8f0; color: #0f172a; }
      .tabs button.active { background: #1d4ed8; color: #fff; }
      .help { color: #475569; font-size: 0.85rem; }
      .error { color: #b91c1c; font-size: 0.9rem; }
      .success { color: #166534; font-size: 0.9rem; }
    `
  ]
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected username = 'admin';
  protected password = '';
  protected mode: 'login' | 'register' = 'login';
  protected registerModel: RegisterPayload = {
    username: '',
    password: '',
    dni: '',
    telefono: '',
    nombres: '',
    apellidos: '',
    email: '',
    fechaNacimiento: ''
  };
  protected loading = false;
  protected error = '';
  protected success = '';

  setMode(mode: 'login' | 'register'): void {
    this.mode = mode;
    this.error = '';
    this.success = '';
  }

  login(): void {
    this.error = '';
    this.success = '';
    this.loading = true;
    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl('/dashboard');
      },
      error: () => {
        this.loading = false;
        this.error = 'Credenciales invalidas o backend no disponible.';
      }
    });
  }

  register(): void {
    this.error = '';
    this.success = '';
    this.loading = true;
    this.authService.register(this.registerModel).subscribe({
      next: () => {
        this.loading = false;
        this.mode = 'login';
        this.username = this.registerModel.username;
        this.password = '';
        this.success = 'Cuenta creada. Ahora inicia sesion.';
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'No se pudo registrar la cuenta.';
      }
    });
  }
}
