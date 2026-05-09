import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-header">
          <a routerLink="/dashboard" class="sidebar-brand">
            <span class="logo-icon">⚡</span>
            <span class="brand-name" *ngIf="!sidebarCollapsed()">Ageru</span>
          </a>
          <button class="toggle-btn" (click)="toggleSidebar()">
            {{ sidebarCollapsed() ? '→' : '←' }}
          </button>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            <span class="nav-icon">🏠</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Inicio</span>
          </a>
          <a routerLink="/dashboard/perfil" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">👤</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Mi Perfil</span>
          </a>
          <a routerLink="/dashboard/cuentas" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">💳</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Mis Cuentas</span>
          </a>
          <a routerLink="/dashboard/movimientos" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📋</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Movimientos</span>
          </a>
          <a routerLink="/dashboard/transferencias" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">$</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Transferencias</span>
          </a>
          <a routerLink="/dashboard/pagos-qr" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">QR</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Pagos QR</span>
          </a>
          <a routerLink="/dashboard/analitica" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">A</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Analitica</span>
          </a>
          <a routerLink="/dashboard/comercios" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">C</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Comercios</span>
          </a>
          <a routerLink="/dashboard/dispositivos" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">D</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Dispositivos</span>
          </a>
          <a routerLink="/dashboard/bancos" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">B</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Bancos</span>
          </a>
          <a routerLink="/dashboard/usuarios" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">👥</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Usuarios</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info" *ngIf="!sidebarCollapsed()">
            <span class="user-avatar">{{ getUserInitials() }}</span>
            <div class="user-details">
              <span class="user-name">{{ authService.currentUser()?.name || 'Usuario' }}</span>
              <span class="user-role">{{ authService.currentUser()?.role || 'user' }}</span>
            </div>
          </div>
          <button class="logout-btn" (click)="logout()" title="Cerrar sesión">
            <span>🚪</span>
            <span *ngIf="!sidebarCollapsed()">Salir</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-layout {
      display: flex;
      min-height: 100dvh;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 260px;
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      transition: width var(--transition-base);
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: 10;
    }
    .sidebar.collapsed {
      width: 72px;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
    }
    .logo-icon {
      font-size: 1.4rem;
    }
    .brand-name {
      font-size: 1.25rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--primary-400), #e879f9);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .toggle-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1rem;
      padding: 0.25rem;
      transition: color var(--transition-fast);
    }
    .toggle-btn:hover {
      color: var(--primary-400);
    }

    .sidebar-nav {
      flex: 1;
      padding: 0.75rem 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      overflow-y: auto;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.7rem 0.85rem;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: 0.9rem;
      font-weight: 500;
      text-decoration: none;
      transition: all var(--transition-fast);
      white-space: nowrap;
    }
    .nav-item:hover {
      background: rgba(139, 92, 246, 0.08);
      color: var(--text-primary);
    }
    .nav-item.active {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.08));
      color: var(--primary-400);
      border-left: 3px solid var(--primary-500);
    }
    .nav-icon {
      font-size: 0.95rem;
      min-width: 1.5rem;
      text-align: center;
      font-weight: 700;
    }

    .sidebar-footer {
      padding: 0.75rem;
      border-top: 1px solid var(--border-subtle);
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, var(--primary-600), var(--primary-500));
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 600;
      flex-shrink: 0;
    }
    .user-details {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .user-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-role {
      font-size: 0.72rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.6rem 0.85rem;
      border: none;
      border-radius: var(--radius-md);
      background: rgba(239, 68, 68, 0.08);
      color: var(--error);
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
      font-family: inherit;
      transition: all var(--transition-fast);
    }
    .logout-btn:hover {
      background: rgba(239, 68, 68, 0.15);
    }

    /* ── Main ── */
    .main-content {
      flex: 1;
      margin-left: 260px;
      padding: 2rem;
      min-height: 100dvh;
      transition: margin-left var(--transition-base);
    }
    .sidebar.collapsed ~ .main-content {
      margin-left: 72px;
    }

    @media (max-width: 768px) {
      .sidebar {
        width: 72px;
      }
      .sidebar .nav-label,
      .sidebar .brand-name,
      .sidebar .user-info,
      .sidebar .toggle-btn {
        display: none !important;
      }
      .sidebar .logout-btn span:last-child {
        display: none;
      }
      .main-content {
        margin-left: 72px;
        padding: 1rem;
      }
    }
  `]
})
export class DashboardPage {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected sidebarCollapsed = signal(false);

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  getUserInitials(): string {
    const name = this.authService.currentUser()?.name || 'U';
    const parts = name.split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login')
    });
  }
}
