import { Routes } from '@angular/router';
import { LandingPage } from './features/landing/pages/landing.page';
import { LoginPage } from './features/auth/pages/login.page';
import { DashboardPage } from './features/dashboard/pages/dashboard.page';
import { DashboardHomePage } from './features/dashboard/pages/dashboard-home.page';
import { PerfilPage } from './features/perfil/pages/perfil.page';
import { CuentasPage } from './features/cuentas/pages/cuentas.page';
import { MovimientosPage } from './features/movimientos/pages/movimientos.page';
import { UsuariosPage } from './features/usuarios/pages/usuarios.page';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: LandingPage
  },
  {
    path: 'login',
    component: LoginPage
  },
  {
    path: 'dashboard',
    component: DashboardPage,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: DashboardHomePage
      },
      {
        path: 'perfil',
        component: PerfilPage
      },
      {
        path: 'cuentas',
        component: CuentasPage
      },
      {
        path: 'movimientos',
        component: MovimientosPage
      },
      {
        path: 'usuarios',
        component: UsuariosPage
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
