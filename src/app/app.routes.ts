import { Routes } from '@angular/router';
import { Shell } from './layout/shell';
import { Login } from './auth/login';
import { Placeholder } from './shared/placeholder';
import { Laboratorios } from './laboratorios/laboratorios';
import { Puestos } from './puestos/puestos';
import { Equipos } from './equipos/equipos';
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
        component: Placeholder,
        data: { titulo: 'Catálogo de Tipos de Equipo' },
        canActivate: [roleGuard('admin', 'gestion_laboratorios')],
      },
      {
        path: 'licencias',
        component: Placeholder,
        data: { titulo: 'Licencias de Software' },
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