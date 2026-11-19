import { Routes } from '@angular/router';
import { Shell } from './layout/shell';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login').then((m) => m.Login),
    canActivate: [guestGuard],
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'laboratorios',
        loadComponent: () => import('./laboratorios/laboratorios').then((m) => m.Laboratorios),
      },
      {
        path: 'puestos',
        loadComponent: () => import('./puestos/puestos').then((m) => m.Puestos),
        canActivate: [roleGuard('admin', 'gestion_laboratorios')],
      },
      {
        path: 'equipos',
        loadComponent: () => import('./equipos/equipos').then((m) => m.Equipos),
        canActivate: [roleGuard('admin', 'gestion_laboratorios')],
      },
      {
        path: 'tipos-equipo',
        loadComponent: () => import('./tipos-equipo/tipos-equipo').then((m) => m.TiposEquipo),
        canActivate: [roleGuard('admin', 'gestion_laboratorios')],
      },
      {
        path: 'licencias',
        loadComponent: () => import('./licencias/licencias').then((m) => m.Licencias),
        canActivate: [roleGuard('admin', 'gestion_laboratorios')],
      },
      {
        path: 'horarios',
        loadComponent: () => import('./horarios/horarios').then((m) => m.Horarios),
      },
      {
        path: 'alumnos',
        loadComponent: () => import('./alumnos/alumnos').then((m) => m.Alumnos),
        canActivate: [roleGuard('admin', 'gestion_laboratorios', 'docente')],
      },
      {
        path: 'incidentes',
        loadComponent: () => import('./incidentes/incidentes').then((m) => m.Incidentes),
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./usuarios/usuarios').then((m) => m.Usuarios),
        canActivate: [roleGuard('admin')],
      },
      {
        path: 'roles',
        loadComponent: () => import('./roles/roles').then((m) => m.Roles),
        canActivate: [roleGuard('admin')],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];