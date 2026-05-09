import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-dashboard-home',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home">
      <div class="welcome-card">
        <div class="welcome-text">
          <h1>Bienvenido, <span class="gradient-text">{{ userName() }}</span></h1>
          <p>Aquí tienes un resumen de tu cuenta.</p>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-body">
            <span class="stat-label">Saldo disponible</span>
            <span class="stat-value">S/ {{ saldo() }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-body">
            <span class="stat-label">Límite diario</span>
            <span class="stat-value">S/ {{ limiteDiario() }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💳</div>
          <div class="stat-body">
            <span class="stat-label">Cuenta</span>
            <span class="stat-value">{{ numeroCuenta() }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🏦</div>
          <div class="stat-body">
            <span class="stat-label">Banco</span>
            <span class="stat-value">{{ banco() }}</span>
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <h2>Accesos rápidos</h2>
        <div class="actions-grid">
          <a routerLink="/dashboard/perfil" class="action-card">
            <span class="action-icon">👤</span>
            <span class="action-label">Mi Perfil</span>
          </a>
          <a routerLink="/dashboard/cuentas" class="action-card">
            <span class="action-icon">💳</span>
            <span class="action-label">Mis Cuentas</span>
          </a>
          <a routerLink="/dashboard/movimientos" class="action-card">
            <span class="action-icon">📋</span>
            <span class="action-label">Movimientos</span>
          </a>
          <a routerLink="/dashboard/transferencias" class="action-card">
            <span class="action-icon">$</span>
            <span class="action-label">Transferencias</span>
          </a>
          <a routerLink="/dashboard/pagos-qr" class="action-card">
            <span class="action-icon">QR</span>
            <span class="action-label">Pagos QR</span>
          </a>
          <a routerLink="/dashboard/analitica" class="action-card">
            <span class="action-icon">A</span>
            <span class="action-label">Analitica</span>
          </a>
          <a routerLink="/dashboard/comercios" class="action-card">
            <span class="action-icon">C</span>
            <span class="action-label">Comercios</span>
          </a>
          <a routerLink="/dashboard/dispositivos" class="action-card">
            <span class="action-icon">D</span>
            <span class="action-label">Dispositivos</span>
          </a>
          <a routerLink="/dashboard/bancos" class="action-card">
            <span class="action-icon">B</span>
            <span class="action-label">Bancos</span>
          </a>
          <a routerLink="/dashboard/usuarios" class="action-card">
            <span class="action-icon">👥</span>
            <span class="action-label">Usuarios</span>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home {
      max-width: 900px;
      animation: fadeIn 0.4s ease;
    }
    .welcome-card {
      background: linear-gradient(135deg, var(--primary-900), var(--bg-card));
      border: 1px solid var(--primary-700);
      border-radius: var(--radius-xl);
      padding: 2rem;
      margin-bottom: 1.5rem;
    }
    .welcome-text h1 {
      font-size: 1.6rem;
      font-weight: 700;
      margin-bottom: 0.3rem;
    }
    .welcome-text p {
      color: var(--text-secondary);
      font-size: 0.95rem;
    }
    .gradient-text {
      background: linear-gradient(135deg, var(--primary-400), #e879f9);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      transition: all var(--transition-fast);
    }
    .stat-card:hover {
      border-color: var(--primary-700);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .stat-icon { font-size: 1.8rem; }
    .stat-body {
      display: flex;
      flex-direction: column;
    }
    .stat-label {
      font-size: 0.78rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .stat-value {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .quick-actions h2 {
      font-size: 1.15rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.75rem;
    }
    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.25rem;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      text-decoration: none;
      transition: all var(--transition-fast);
    }
    .action-card:hover {
      border-color: var(--primary-600);
      background: var(--bg-card-hover);
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
    }
    .action-icon { font-size: 1.45rem; font-weight: 800; min-height: 2rem; }
    .action-label {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-secondary);
    }
    .action-card:hover .action-label {
      color: var(--primary-400);
    }
  `]
})
export class DashboardHomePage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);

  protected userName = signal('');
  protected saldo = signal('0.00');
  protected limiteDiario = signal('0.00');
  protected numeroCuenta = signal('---');
  protected banco = signal('---');

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.userName.set(user?.name?.split(' ')[0] || 'Usuario');

    const headers = this.authService.getAuthHeaders();
    this.http.get<any>(`${environment.apiBaseUrl}/cuentas/saldo`, { headers }).subscribe({
      next: (data) => {
        this.saldo.set(data.saldoSoles || '0.00');
        this.limiteDiario.set(
          ((data.limiteDiarioCentavos || 50000) / 100).toFixed(2)
        );
        this.numeroCuenta.set(data.numeroCuentaEnmascarado || '---');
        this.banco.set(data.bancoNombre || '---');
      },
      error: () => {}
    });
  }
}
