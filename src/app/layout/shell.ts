import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../core/services/auth.service';
import { RolClave } from '../core/models/modelos';

interface EnlaceNav {
  ruta: string;
  texto: string;
  icono: string;
  roles?: RolClave[];
}

interface GrupoNav {
  titulo: string;
  enlaces: EnlaceNav[];
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="flex h-screen overflow-hidden bg-page">
      <!-- Backdrop móvil -->
      @if (menuAbierto()) {
        <div
          class="fixed inset-0 bg-black/50 z-30 lg:hidden"
          (click)="menuAbierto.set(false)"></div>
      }

      <!-- Sidebar fijo -->
      <aside
        class="fixed lg:static inset-y-0 left-0 z-40 w-64 shrink-0 bg-ink text-white flex flex-col transition-transform duration-200 lg:translate-x-0"
        [class.-translate-x-full]="!menuAbierto()"
        [class.translate-x-0]="menuAbierto()">
        <!-- Marca -->
        <div class="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <mat-icon class="text-white! text-xl! w-5! h-5!">science</mat-icon>
            </div>
            <div>
              <p class="text-lg font-bold tracking-wider leading-none">SIGEMAL</p>
              <p class="text-[11px] text-slate-400 mt-0.5">Gestión de laboratorios</p>
            </div>
          </div>
          <button
            type="button"
            class="lg:hidden text-slate-400 hover:text-white cursor-pointer"
            (click)="menuAbierto.set(false)">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Navegación agrupada con scroll independiente -->
        <nav class="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          @for (grupo of gruposVisibles(); track grupo.titulo) {
            <div>
              <p class="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {{ grupo.titulo }}
              </p>
              <div class="space-y-0.5">
                @for (e of grupo.enlaces; track e.ruta) {
                  <a
                    [routerLink]="e.ruta"
                    routerLinkActive="bg-primary text-white shadow-sm"
                    #rla="routerLinkActive"
                    (click)="menuAbierto.set(false)"
                    class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    [class.text-slate-300]="!rla.isActive"
                    [class.hover:bg-white/10]="!rla.isActive"
                    [class.hover:text-white]="!rla.isActive">
                    <mat-icon class="text-xl! w-5! h-5!">{{ e.icono }}</mat-icon>
                    <span class="truncate">{{ e.texto }}</span>
                  </a>
                }
              </div>
            </div>
          }
        </nav>

        <!-- Perfil + Cerrar sesión siempre visible -->
        <div class="p-3 border-t border-white/10 bg-black/20 shrink-0">
          <div class="flex items-center gap-3 px-2 py-1.5 mb-2">
            <div
              class="w-9 h-9 rounded-full bg-primary/30 border border-primary/60 text-white font-semibold flex items-center justify-center shrink-0 uppercase">
              {{ inicialUsuario() }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-white truncate leading-tight">
                {{ auth.nombreMostrado() }}
              </p>
              <p class="text-xs text-accent capitalize truncate mt-0.5">
                {{ auth.rol() || 'Sin rol' }}
              </p>
            </div>
          </div>

          <button
            type="button"
            (click)="auth.cerrarSesion()"
            class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-danger/80 bg-white/5 transition-colors cursor-pointer">
            <mat-icon class="text-base! w-4! h-4!">logout</mat-icon>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <!-- Área principal -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Barra superior compacta (móvil y contexto rápido) -->
        <header class="h-14 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="lg:hidden p-1.5 rounded-lg text-ink hover:bg-slate-100 cursor-pointer"
              (click)="menuAbierto.set(true)"
              aria-label="Abrir menú">
              <mat-icon>menu</mat-icon>
            </button>
            <span class="text-sm font-medium text-muted hidden sm:inline">
              Sistema de Inventario y Gestión de Laboratorios
            </span>
          </div>

          <div class="flex items-center gap-2 text-xs text-muted">
            <span class="w-2 h-2 rounded-full bg-ok"></span>
            <span>Conectado · <strong class="text-ink">{{ auth.username() }}</strong></span>
          </div>
        </header>

        <main class="flex-1 p-5 lg:p-8 overflow-y-auto">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class Shell implements OnInit {
  auth = inject(AuthService);
  menuAbierto = signal(false);

  private readonly grupos: GrupoNav[] = [
    {
      titulo: 'General',
      enlaces: [
        { ruta: '/dashboard', texto: 'Dashboard', icono: 'dashboard' },
        { ruta: '/incidentes', texto: 'Incidentes', icono: 'report_problem' },
      ],
    },
    {
      titulo: 'Infraestructura e Inventario',
      enlaces: [
        { ruta: '/laboratorios', texto: 'Laboratorios', icono: 'science' },
        {
          ruta: '/puestos',
          texto: 'Puestos',
          icono: 'desktop_windows',
          roles: ['admin', 'gestion_laboratorios'],
        },
        {
          ruta: '/equipos',
          texto: 'Equipos',
          icono: 'computer',
          roles: ['admin', 'gestion_laboratorios'],
        },
        {
          ruta: '/tipos-equipo',
          texto: 'Tipos de Equipo',
          icono: 'category',
          roles: ['admin', 'gestion_laboratorios'],
        },
        {
          ruta: '/licencias',
          texto: 'Licencias',
          icono: 'vpn_key',
          roles: ['admin', 'gestion_laboratorios'],
        },
      ],
    },
    {
      titulo: 'Gestión Académica',
      enlaces: [
        { ruta: '/horarios', texto: 'Horarios y Turnos', icono: 'event' },
        {
          ruta: '/alumnos',
          texto: 'Alumnos',
          icono: 'school',
          roles: ['admin', 'gestion_laboratorios', 'docente'],
        },
      ],
    },
    {
      titulo: 'Administración',
      enlaces: [
        { ruta: '/usuarios', texto: 'Usuarios', icono: 'manage_accounts', roles: ['admin'] },
        { ruta: '/roles', texto: 'Roles y Permisos', icono: 'admin_panel_settings', roles: ['admin'] },
      ],
    },
  ];

  gruposVisibles = computed(() =>
    this.grupos
      .map((g) => ({
        ...g,
        enlaces: g.enlaces.filter((e) => !e.roles || this.auth.tieneRol(...e.roles)),
      }))
      .filter((g) => g.enlaces.length > 0)
  );

  inicialUsuario = computed(() => this.auth.nombreMostrado().charAt(0) || 'U');

  ngOnInit() {
    if (this.auth.estaAutenticado() && !this.auth.usuario()) {
      this.auth.cargarPerfil().subscribe({ error: () => {} });
    }
  }
}