import { Routes } from '@angular/router';
import { Shell } from './layout/shell';
import { Placeholder } from './shared/placeholder';
import { Laboratorios } from './laboratorios/laboratorios';
import { Horarios } from './horarios/horarios';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: Placeholder, data: { titulo: 'Dashboard' } },
      { path: 'laboratorios', component: Laboratorios },
      { path: 'puestos', component: Placeholder, data: { titulo: 'Puestos' } },
      { path: 'equipos', component: Placeholder, data: { titulo: 'Equipos' } },
      { path: 'horarios', component: Horarios },      
      { path: 'incidentes', component: Placeholder, data: { titulo: 'Incidentes' } },
    ],
  },
  { path: '**', redirectTo: '' },
];