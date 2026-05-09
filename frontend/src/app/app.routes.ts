import { Routes } from '@angular/router';
import { LandingPage } from './features/landing/pages/landing.page';
import { LoginPage } from './features/auth/pages/login.page';
import { DashboardPage } from './features/dashboard/pages/dashboard.page';
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
    canActivate: [authGuard]
  },
  {
    path: 'usuarios',
    component: UsuariosPage
  },
  {
    path: '**',
    redirectTo: ''
  }
];
