import { Routes } from '@angular/router';
import { UsuariosPage } from './usuarios.page';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'usuarios',
    pathMatch: 'full'
  },
  {
    path: 'usuarios',
    component: UsuariosPage
  }
];
