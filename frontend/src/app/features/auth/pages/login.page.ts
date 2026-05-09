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
    <div class="login-wrapper">
      <div class="login-bg-orb orb-1"></div>
      <div class="login-bg-orb orb-2"></div>

      <div class="login-card">
        <a routerLink="/" class="back-link">← Volver al inicio</a>

        <div class="brand">
          <span class="logo-icon">⚡</span>
          <h1 class="logo-text">Ageru</h1>
        </div>
        <p class="subtitle">
          {{ mode === 'login' ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta nueva' }}
        </p>

        <div class="tabs">
          <button type="button" [class.active]="mode === 'login'" (click)="setMode('login')">
            Iniciar sesión
          </button>
          <button type="button" [class.active]="mode === 'register'" (click)="setMode('register')">
            Registrarme
          </button>
        </div>

        <!-- Login Form -->
        <form class="form" *ngIf="mode === 'login'" (ngSubmit)="login()" #loginForm="ngForm">
          <div class="field">
            <label for="login-username">Usuario</label>
            <input
              id="login-username"
              name="username"
              [(ngModel)]="username"
              placeholder="tu&#64;email.com"
              required
              autocomplete="username"
            />
          </div>
          <div class="field">
            <label for="login-password">Contraseña</label>
            <input
              id="login-password"
              type="password"
              name="password"
              [(ngModel)]="password"
              placeholder="••••••••"
              required
              autocomplete="current-password"
            />
          </div>
          <button type="submit" class="btn-submit" [disabled]="loading || loginForm.invalid">
            {{ loading ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>

        <!-- Register Form -->
        <form
          class="form"
          *ngIf="mode === 'register'"
          (ngSubmit)="register()"
          #registerForm="ngForm"
        >
          <div class="form-row">
            <div class="field">
              <label for="reg-nombres">Nombres</label>
              <input id="reg-nombres" name="nombres" [(ngModel)]="registerModel.nombres" required />
            </div>
            <div class="field">
              <label for="reg-apellidos">Apellidos</label>
              <input id="reg-apellidos" name="apellidos" [(ngModel)]="registerModel.apellidos" required />
            </div>
          </div>
          <div class="field">
            <label for="reg-username">Usuario (email)</label>
            <input
              id="reg-username"
              name="regUsername"
              [(ngModel)]="registerModel.username"
              required
              placeholder="tu&#64;email.com"
            />
          </div>
          <div class="field">
            <label for="reg-password">Contraseña</label>
            <input
              id="reg-password"
              type="password"
              name="regPassword"
              [(ngModel)]="registerModel.password"
              required
              minlength="6"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div class="form-row">
            <div class="field">
              <label for="reg-dni">DNI</label>
              <input
                id="reg-dni"
                name="dni"
                [(ngModel)]="registerModel.dni"
                required
                minlength="8"
                maxlength="8"
                placeholder="12345678"
              />
            </div>
            <div class="field">
              <label for="reg-telefono">Teléfono</label>
              <input
                id="reg-telefono"
                name="telefono"
                [(ngModel)]="registerModel.telefono"
                required
                placeholder="999111222"
              />
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="reg-email">Email (opcional)</label>
              <input id="reg-email" name="email" [(ngModel)]="registerModel.email" />
            </div>
            <div class="field">
              <label for="reg-fecha">Fecha de nacimiento</label>
              <input
                id="reg-fecha"
                type="date"
                name="fechaNacimiento"
                [(ngModel)]="registerModel.fechaNacimiento"
                required
              />
            </div>
          </div>
          <button type="submit" class="btn-submit" [disabled]="loading || registerForm.invalid">
            {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
          </button>
        </form>

        <p class="help" *ngIf="mode === 'login'">
          ¿No tienes cuenta? Usa la pestaña <strong>"Registrarme"</strong>.
        </p>
        <p class="help" *ngIf="mode === 'register'">
          Al registrarte, te cambiamos automáticamente a inicio de sesión.
        </p>
        <div class="msg-error" *ngIf="error">{{ error }}</div>
        <div class="msg-success" *ngIf="success">{{ success }}</div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      position: relative;
      overflow: hidden;
    }
    .login-bg-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      opacity: 0.2;
      pointer-events: none;
    }
    .orb-1 {
      width: 500px;
      height: 500px;
      background: var(--primary-600);
      top: -150px;
      left: -150px;
      animation: float 8s ease-in-out infinite;
    }
    .orb-2 {
      width: 350px;
      height: 350px;
      background: #e879f9;
      bottom: -100px;
      right: -100px;
      animation: float 10s ease-in-out infinite reverse;
    }

    .login-card {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 480px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl);
      padding: 2rem;
      box-shadow: var(--shadow-lg);
      animation: fadeIn 0.5s ease;
    }

    .back-link {
      display: inline-block;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
      transition: color var(--transition-fast);
    }
    .back-link:hover {
      color: var(--primary-400);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }
    .logo-icon { font-size: 1.5rem; }
    .logo-text {
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--primary-400), #e879f9);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0;
    }

    .subtitle {
      color: var(--text-secondary);
      font-size: 0.95rem;
      margin-bottom: 1.25rem;
    }

    .tabs {
      display: flex;
      gap: 0;
      margin-bottom: 1.25rem;
      background: var(--bg-primary);
      border-radius: var(--radius-md);
      padding: 0.25rem;
    }
    .tabs button {
      flex: 1;
      padding: 0.6rem;
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text-muted);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
      font-family: inherit;
    }
    .tabs button.active {
      background: linear-gradient(135deg, var(--primary-700), var(--primary-600));
      color: #fff;
      box-shadow: var(--shadow-sm);
    }
    .tabs button:not(.active):hover {
      color: var(--text-secondary);
    }

    .form {
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
      transition: border-color var(--transition-fast);
      outline: none;
    }
    .field input::placeholder {
      color: var(--text-muted);
    }
    .field input:focus {
      border-color: var(--primary-500);
      box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
    }

    .btn-submit {
      width: 100%;
      padding: 0.75rem;
      background: linear-gradient(135deg, var(--primary-600), var(--primary-500));
      color: #fff;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all var(--transition-fast);
      margin-top: 0.25rem;
    }
    .btn-submit:hover:not(:disabled) {
      background: linear-gradient(135deg, var(--primary-500), var(--primary-400));
      box-shadow: var(--shadow-glow);
    }
    .btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .help {
      color: var(--text-muted);
      font-size: 0.82rem;
      margin-top: 1rem;
      text-align: center;
    }
    .help strong {
      color: var(--primary-400);
    }

    .msg-error {
      margin-top: 0.75rem;
      padding: 0.6rem 0.8rem;
      background: var(--error-bg);
      color: var(--error);
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      text-align: center;
    }
    .msg-success {
      margin-top: 0.75rem;
      padding: 0.6rem 0.8rem;
      background: var(--success-bg);
      color: var(--success);
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      text-align: center;
    }

    @media (max-width: 500px) {
      .form-row { grid-template-columns: 1fr; }
      .login-card { padding: 1.5rem; }
    }
  `]
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected username = '';
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
        this.error = 'Credenciales inválidas o backend no disponible.';
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
        this.success = 'Cuenta creada exitosamente. Ahora inicia sesión.';
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'No se pudo registrar la cuenta.';
      }
    });
  }
}
