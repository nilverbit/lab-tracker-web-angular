import { Routes } from '@angular/router';
import { Shell } from './layout/shell';
import { Login } from './auth/login';
import { Placeholder } from './shared/placeholder';
import { Laboratorios } from './laboratorios/laboratorios';
import { Puestos } from './puestos/puestos';
import { Equipos } from './equipos/equipos';
import { TiposEquipo } from './tipos-equipo/tipos-equipo';
import { Licencias } from './licencias/licencias';
import { Horarios } from './horarios/horarios';
import { Incidentes } from './incidentes/incidentes';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
    canActivate: [guestGuard],
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: Placeholder, data: { titulo: 'Dashboard' } },
      { path: 'laboratorios', component: Laboratorios },
      {
        path: 'puestos',
        component: Puestos,
        canActivate: [roleGuard('admin', 'gestion_laboratorios')],
      },
      {
        path: 'equipos',
        component: Equipos,
        canActivate: [roleGuard('admin', 'gestion_laboratorios')],
      },
      {
        path: 'tipos-equipo',
        component: TiposEquipo,
        canActivate: [roleGuard('admin', 'gestion_laboratorios')],
      },
      {
        path: 'licencias',
        component: Licencias,
        canActivate: [roleGuard('admin', 'gestion_laboratorios')],
      },
      { path: 'horarios', component: Horarios },
      {
        path: 'alumnos',
        component: Placeholder,
        data: { titulo: 'Gestión de Alumnos' },
        canActivate: [roleGuard('admin', 'gestion_laboratorios', 'docente')],
      },
      { path: 'incidentes', component: Incidentes },
      {
        path: 'usuarios',
        component: Placeholder,
        data: { titulo: 'Usuarios del Sistema' },
        canActivate: [roleGuard('admin')],
      },
      {
        path: 'roles',
        component: Placeholder,
        data: { titulo: 'Roles y Permisos' },
        canActivate: [roleGuard('admin')],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];