import { Routes } from '@angular/router';
import { Shell } from './layout/shell';
import { Placeholder } from './shared/placeholder';
import { Laboratorios } from './laboratorios/laboratorios';
import { Puestos } from './puestos/puestos';
import { Equipos } from './equipos/equipos';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: Placeholder, data: { titulo: 'Dashboard' } },
      { path: 'laboratorios', component: Laboratorios },
      { path: 'puestos', component: Puestos },
      { path: 'equipos', component: Equipos },
      { path: 'horarios', component: Placeholder, data: { titulo: 'Horarios' } },
      { path: 'incidentes', component: Placeholder, data: { titulo: 'Incidentes' } },
    ],
  },
  { path: '**', redirectTo: '' },
];