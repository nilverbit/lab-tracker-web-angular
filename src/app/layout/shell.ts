import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="flex min-h-screen">
      <aside class="w-64 shrink-0 bg-ink text-white flex flex-col">
        <div class="px-6 py-5 border-b border-white/10">
          <p class="text-xl font-bold tracking-wide">SIGEMAL</p>
          <p class="text-xs text-slate-400">Gestión de laboratorios</p>
        </div>
        <nav class="flex-1 py-4">
          @for (e of enlaces; track e.ruta) {
            <a
              [routerLink]="e.ruta"
              routerLinkActive="bg-white/10 border-l-accent! text-white!"
              class="flex items-center gap-3 px-6 py-3 border-l-4 border-l-transparent text-slate-300 hover:bg-white/5 hover:text-white">
              <mat-icon>{{ e.icono }}</mat-icon>
              <span>{{ e.texto }}</span>
            </a>
          }
        </nav>
      </aside>
      <main class="flex-1 p-8 overflow-auto">
        <router-outlet />
      </main>
    </div>`,
})
export class Shell {
  enlaces = [
    { ruta: '/dashboard', texto: 'Dashboard', icono: 'dashboard' },
    { ruta: '/laboratorios', texto: 'Laboratorios', icono: 'science' },
    { ruta: '/puestos', texto: 'Puestos', icono: 'desktop_windows' },
    { ruta: '/equipos', texto: 'Equipos', icono: 'computer' },
    { ruta: '/horarios', texto: 'Horarios', icono: 'event' },
    { ruta: '/incidentes', texto: 'Incidentes', icono: 'report_problem' },
  ];
}