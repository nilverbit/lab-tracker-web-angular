import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../core/services/auth.service';
import { LaboratorioService } from '../core/services/laboratorio.service';
import { EquipoService } from '../core/services/equipo.service';
import { HorarioService } from '../core/services/horario.service';
import { IncidenteService } from '../core/services/incidente.service';
import { LicenciaService } from '../core/services/licencia.service';
import { AlumnoService } from '../core/services/alumno.service';
import { UsuarioService } from '../core/services/usuario.service';
import { StatusChip } from '../shared/status-chip';
import {
  Equipo,
  Horario,
  Incidente,
  Laboratorio,
  Licencia,
} from '../core/models/modelos';

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatTooltipModule,
    StatusChip,
  ],
  template: `
    <div class="space-y-6">
      <!-- Encabezado ejecutivo -->
      <div class="bg-gradient-to-r from-ink to-slate-800 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 text-xs text-accent font-semibold uppercase tracking-wider mb-1">
            <span>Panel General SIGEMAL</span>
            <span>·</span>
            <span class="capitalize">{{ auth.rol() }}</span>
          </div>
          <h1 class="text-2xl font-bold leading-tight">
            Hola, {{ auth.nombreMostrado() }}
          </h1>
          <p class="text-sm text-slate-300 mt-1">
            Resumen operativo al {{ hoyDate | date: 'dd/MM/yyyy' }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <a
            routerLink="/incidentes"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors">
            <mat-icon class="text-base! w-4! h-4! text-accent!">report_problem</mat-icon>
            <span>Incidentes</span>
          </a>
          <a
            routerLink="/horarios"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-semibold shadow-sm transition-colors">
            <mat-icon class="text-base! w-4! h-4!">event</mat-icon>
            <span>Gestionar Turnos</span>
          </a>
          <button
            type="button"
            (click)="cargar()"
            [disabled]="cargando()"
            matTooltip="Actualizar métricas"
            class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-50">
            <mat-icon class="text-lg! w-5! h-5!">refresh</mat-icon>
          </button>
        </div>
      </div>

      @if (cargando()) {
        <mat-progress-bar mode="indeterminate" class="rounded-full"></mat-progress-bar>
      }

      <!-- Tarjetas KPI principales -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <!-- Laboratorios -->
        <a
          routerLink="/laboratorios"
          class="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-primary/50 hover:shadow-md transition-all group">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-muted">Laboratorios</p>
              <p class="text-3xl font-bold text-ink mt-1">{{ totalLabs() }}</p>
            </div>
            <div class="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
              <mat-icon>science</mat-icon>
            </div>
          </div>
          <p class="text-xs text-muted mt-3 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-ok"></span>
            <span><strong class="text-ink">{{ labsDisponibles() }}</strong> disponibles actualmente</span>
          </p>
        </a>

        <!-- Equipos (solo Admin y Gestión) -->
        @if (puedeVerInventario()) {
          <a
            routerLink="/equipos"
            class="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-primary/50 hover:shadow-md transition-all group">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-muted">Equipos</p>
                <p class="text-3xl font-bold text-ink mt-1">{{ totalEquipos() }}</p>
              </div>
              <div class="w-11 h-11 rounded-xl bg-blue-50 text-info flex items-center justify-center group-hover:bg-info group-hover:text-white transition-colors">
                <mat-icon>computer</mat-icon>
              </div>
            </div>
            <p class="text-xs text-muted mt-3 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full" [class.bg-ok]="equiposConProblema() === 0" [class.bg-warn]="equiposConProblema() > 0"></span>
              <span>
                <strong class="text-ink">{{ equiposOperativos() }}</strong> operativos
                @if (equiposConProblema() > 0) {
                  · <strong class="text-danger">{{ equiposConProblema() }}</strong> con alerta
                }
              </span>
            </p>
          </a>
        }

        <!-- Incidentes Pendientes -->
        <a
          routerLink="/incidentes"
          class="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-warn/50 hover:shadow-md transition-all group">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-muted">Incidentes Abiertos</p>
              <p
                class="text-3xl font-bold mt-1"
                [class.text-danger]="totalIncidentesPendientes() > 0"
                [class.text-ok]="totalIncidentesPendientes() === 0">
                {{ totalIncidentesPendientes() }}
              </p>
            </div>
            <div class="w-11 h-11 rounded-xl bg-amber-50 text-warn flex items-center justify-center group-hover:bg-warn group-hover:text-white transition-colors">
              <mat-icon>report_problem</mat-icon>
            </div>
          </div>
          <p class="text-xs text-muted mt-3">
            @if (incidentesCriticos() > 0) {
              <strong class="text-danger">{{ incidentesCriticos() }}</strong> de prioridad alta o crítica
            } @else if (totalIncidentesPendientes() > 0) {
              Sin incidencias críticas en cola
            } @else {
              Sin incidencias pendientes
            }
          </p>
        </a>

        <!-- Alumnos -->
        <a
          routerLink="/alumnos"
          class="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-primary/50 hover:shadow-md transition-all group">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-muted">Alumnos</p>
              <p class="text-3xl font-bold text-ink mt-1">{{ totalAlumnos() }}</p>
            </div>
            <div class="w-11 h-11 rounded-xl bg-ok-bg text-ok flex items-center justify-center group-hover:bg-ok group-hover:text-white transition-colors">
              <mat-icon>school</mat-icon>
            </div>
          </div>
          <p class="text-xs text-muted mt-3">
            Estudiantes registrados en SIGEMAL
          </p>
        </a>

        <!-- Licencias (solo Admin y Gestión) -->
        @if (puedeVerInventario()) {
          <a
            routerLink="/licencias"
            class="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-primary/50 hover:shadow-md transition-all group">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-muted">Licencias</p>
                <p class="text-3xl font-bold text-ink mt-1">{{ totalLicencias() }}</p>
              </div>
              <div class="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <mat-icon>vpn_key</mat-icon>
              </div>
            </div>
            <p class="text-xs text-muted mt-3">
              @if (licenciasEnAlerta().length > 0) {
                <strong class="text-warn">{{ licenciasEnAlerta().length }}</strong> vencidas o por vencer
              } @else {
                Todas las licencias vigentes
              }
            </p>
          </a>
        }

        <!-- Usuarios (solo Admin) -->
        @if (auth.esAdmin()) {
          <a
            routerLink="/usuarios"
            class="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-primary/50 hover:shadow-md transition-all group">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-muted">Usuarios</p>
                <p class="text-3xl font-bold text-ink mt-1">{{ totalUsuarios() }}</p>
              </div>
              <div class="w-11 h-11 rounded-xl bg-slate-100 text-ink flex items-center justify-center group-hover:bg-ink group-hover:text-white transition-colors">
                <mat-icon>manage_accounts</mat-icon>
              </div>
            </div>
            <p class="text-xs text-muted mt-3">
              Cuentas con acceso al sistema
            </p>
          </a>
        }
      </div>

      <!-- Fila operativa: Turnos de hoy + Incidentes pendientes -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Turnos programados hoy -->
        <div class="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <mat-icon class="text-primary!">event</mat-icon>
              <div>
                <h2 class="text-sm font-bold text-ink">Turnos de Hoy</h2>
                <p class="text-xs text-muted">{{ hoyIso }}</p>
              </div>
            </div>
            <a routerLink="/horarios" class="text-xs font-semibold text-primary hover:underline">
              Ver todos
            </a>
          </div>

          <div class="p-4 flex-1">
            @if (horariosHoy().length === 0) {
              <div class="py-8 text-center text-muted">
                <mat-icon class="text-3xl! w-8! h-8! text-slate-300! mb-1">event_available</mat-icon>
                <p class="text-sm font-medium text-ink">No hay turnos programados para hoy</p>
                <a routerLink="/horarios" class="text-xs text-primary hover:underline mt-1 inline-block">
                  Programar un horario
                </a>
              </div>
            } @else {
              <div class="divide-y divide-slate-100">
                @for (h of horariosHoy(); track h.id) {
                  <div class="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-ink truncate">{{ h.nombre_turno }}</p>
                      <p class="text-xs text-muted truncate">
                        {{ nombreLab(h.laboratorio_id) }} · {{ h.docente_responsable }}
                      </p>
                    </div>
                    <div class="text-right shrink-0 space-y-1">
                      <div class="text-xs font-mono font-semibold text-primary">
                        {{ h.hora_inicio.slice(0, 5) }} - {{ h.hora_fin.slice(0, 5) }}
                      </div>
                      <app-status-chip [valor]="h.estado" />
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Incidentes pendientes recientes -->
        <div class="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <mat-icon class="text-warn!">report_problem</mat-icon>
              <div>
                <h2 class="text-sm font-bold text-ink">Incidentes Sin Resolver</h2>
                <p class="text-xs text-muted">Últimos reportes pendientes o en proceso</p>
              </div>
            </div>
            <a routerLink="/incidentes" class="text-xs font-semibold text-primary hover:underline">
              Atender
            </a>
          </div>

          <div class="p-4 flex-1">
            @if (incidentesPendientes().length === 0) {
              <div class="py-8 text-center text-muted">
                <mat-icon class="text-3xl! w-8! h-8! text-ok! mb-1">check_circle</mat-icon>
                <p class="text-sm font-medium text-ink">Todo en orden</p>
                <p class="text-xs mt-0.5">No hay incidentes pendientes de atención.</p>
              </div>
            } @else {
              <div class="divide-y divide-slate-100">
                @for (inc of incidentesPendientes(); track inc.id) {
                  <div class="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-ink line-clamp-1">{{ inc.descripcion }}</p>
                      <p class="text-xs text-muted mt-0.5">
                        {{ inc.reportado_por }} · {{ inc.fecha_reporte | date: 'dd/MM HH:mm' }}
                      </p>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                      <app-status-chip [valor]="inc.prioridad" />
                      <app-status-chip [valor]="inc.estado" />
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Fila de salud de inventario (solo Admin y Gestión) -->
      @if (puedeVerInventario()) {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Salud del parque de equipos -->
          <div class="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-sm font-bold text-ink">Estado del Inventario de Equipos</h2>
                <p class="text-xs text-muted">Distribución por condición técnica</p>
              </div>
              <a routerLink="/equipos" class="text-xs font-semibold text-primary hover:underline">
                Ir al inventario
              </a>
            </div>

            <div class="space-y-3">
              @for (b of barrasEquipos(); track b.etiqueta) {
                <div>
                  <div class="flex items-center justify-between text-xs mb-1">
                    <span class="font-medium text-ink">{{ b.etiqueta }}</span>
                    <span class="text-muted font-mono">
                      {{ b.cantidad }} ({{ b.porcentaje }}%)
                    </span>
                  </div>
                  <div class="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-300"
                      [class]="b.colorClase"
                      [style.width.%]="b.porcentaje"></div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Alertas de licencias -->
          <div class="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 flex flex-col">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-sm font-bold text-ink">Control de Vencimiento de Licencias</h2>
                <p class="text-xs text-muted">Software vencido o próximo a expirar (30 días)</p>
              </div>
              <a routerLink="/licencias" class="text-xs font-semibold text-primary hover:underline">
                Ver licencias
              </a>
            </div>

            @if (licenciasEnAlerta().length === 0) {
              <div class="flex-1 flex flex-col items-center justify-center py-6 text-center text-muted">
                <mat-icon class="text-3xl! w-8! h-8! text-ok! mb-1">verified</mat-icon>
                <p class="text-sm font-medium text-ink">Licenciamiento al día</p>
                <p class="text-xs mt-0.5">No hay licencias vencidas ni próximas a vencer.</p>
              </div>
            } @else {
              <div class="divide-y divide-slate-100">
                @for (lic of licenciasEnAlerta().slice(0, 5); track lic.id) {
                  <div class="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-ink truncate">{{ lic.nombre }}</p>
                      <p class="text-xs text-muted font-mono">{{ lic.codigo }}</p>
                    </div>
                    <div class="text-right shrink-0">
                      <p
                        class="text-xs font-semibold"
                        [class.text-danger]="lic.fecha_vencimiento! < hoyIso"
                        [class.text-warn]="lic.fecha_vencimiento! >= hoyIso">
                        {{ lic.fecha_vencimiento }}
                      </p>
                      <span class="text-[11px] text-muted">
                        {{ lic.fecha_vencimiento! < hoyIso ? 'Vencida' : 'Por vencer' }}
                      </span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class Dashboard implements OnInit {
  auth = inject(AuthService);
  private labService = inject(LaboratorioService);
  private equipoService = inject(EquipoService);
  private horarioService = inject(HorarioService);
  private incidenteService = inject(IncidenteService);
  private licenciaService = inject(LicenciaService);
  private alumnoService = inject(AlumnoService);
  private usuarioService = inject(UsuarioService);

  hoyDate = new Date();
  hoyIso = this.obtenerFechaLocalIso();

  cargando = signal(false);

  laboratorios = signal<Laboratorio[]>([]);
  totalLabs = signal(0);
  equipos = signal<Equipo[]>([]);
  totalEquipos = signal(0);
  horariosHoy = signal<Horario[]>([]);
  incidentesPendientes = signal<Incidente[]>([]);
  totalIncidentesPendientes = signal(0);
  licencias = signal<Licencia[]>([]);
  totalLicencias = signal(0);
  totalAlumnos = signal(0);
  totalUsuarios = signal(0);

  puedeVerInventario = computed(() =>
    this.auth.tieneRol('admin', 'gestion_laboratorios')
  );

  labsDisponibles = computed(
    () => this.laboratorios().filter((l) => l.estado === 'disponible').length
  );

  equiposOperativos = computed(
    () => this.equipos().filter((e) => e.estado === 'operativo').length
  );

  equiposConProblema = computed(
    () =>
      this.equipos().filter(
        (e) => e.estado === 'con_falla' || e.estado === 'en_mantenimiento'
      ).length
  );

  incidentesCriticos = computed(
    () =>
      this.incidentesPendientes().filter(
        (i) => i.prioridad === 'critica' || i.prioridad === 'alta'
      ).length
  );

  barrasEquipos = computed(() => {
    const lista = this.equipos();
    const base = lista.length || 1;
    const contar = (estado: Equipo['estado']) =>
      lista.filter((e) => e.estado === estado).length;

    const filas = [
      { etiqueta: 'Operativos', cantidad: contar('operativo'), colorClase: 'bg-ok' },
      { etiqueta: 'En mantenimiento', cantidad: contar('en_mantenimiento'), colorClase: 'bg-warn' },
      { etiqueta: 'Con falla', cantidad: contar('con_falla'), colorClase: 'bg-danger' },
      { etiqueta: 'De baja', cantidad: contar('de_baja'), colorClase: 'bg-slate-400' },
    ];
    return filas.map((f) => ({
      ...f,
      porcentaje: lista.length ? Math.round((f.cantidad / base) * 100) : 0,
    }));
  });

  licenciasEnAlerta = computed(() => {
    const limite = new Date();
    limite.setDate(limite.getDate() + 30);
    const limiteIso = limite.toISOString().slice(0, 10);

    return this.licencias().filter(
      (l) =>
        l.estado !== 'cancelada' &&
        !!l.fecha_vencimiento &&
        l.fecha_vencimiento <= limiteIso
    );
  });

  private mapaLabs = computed(() => {
    const m = new Map<number, string>();
    for (const l of this.laboratorios()) m.set(l.id, l.codigo);
    return m;
  });

  ngOnInit() {
    this.cargar();
  }

  nombreLab(id: number): string {
    return this.mapaLabs().get(id) ?? `Lab #${id}`;
  }

  cargar() {
    this.cargando.set(true);

    forkJoin({
      labs: this.labService
        .getAll({ pagina: 1, tamano_pagina: 100 })
        .pipe(catchError(() => of(null))),
      horarios: this.horarioService
        .getAll({ fecha: this.hoyIso, pagina: 1, tamano_pagina: 6 })
        .pipe(catchError(() => of(null))),
      incidentes: this.incidenteService
        .getAll({ solo_pendientes: true, pagina: 1, tamano_pagina: 6 })
        .pipe(catchError(() => of(null))),
      alumnos: this.alumnoService
        .getAll({ pagina: 1, tamano_pagina: 1 })
        .pipe(catchError(() => of(null))),
      equipos: this.puedeVerInventario()
        ? this.equipoService
            .getAll({ pagina: 1, tamano_pagina: 100 })
            .pipe(catchError(() => of(null)))
        : of(null),
      licencias: this.puedeVerInventario()
        ? this.licenciaService
            .getAll({ pagina: 1, tamano_pagina: 100 })
            .pipe(catchError(() => of(null)))
        : of(null),
      usuarios: this.auth.esAdmin()
        ? this.usuarioService
            .getAll({ pagina: 1, tamano_pagina: 1 })
            .pipe(catchError(() => of(null)))
        : of(null),
    }).subscribe({
      next: (res) => {
        if (res.labs) {
          this.laboratorios.set(res.labs.items);
          this.totalLabs.set(res.labs.total);
        }
        if (res.horarios) {
          this.horariosHoy.set(res.horarios.items);
        }
        if (res.incidentes) {
          this.incidentesPendientes.set(res.incidentes.items);
          this.totalIncidentesPendientes.set(res.incidentes.total);
        }
        if (res.alumnos) {
          this.totalAlumnos.set(res.alumnos.total);
        }
        if (res.equipos) {
          this.equipos.set(res.equipos.items);
          this.totalEquipos.set(res.equipos.total);
        }
        if (res.licencias) {
          this.licencias.set(res.licencias.items);
          this.totalLicencias.set(res.licencias.total);
        }
        if (res.usuarios) {
          this.totalUsuarios.set(res.usuarios.total);
        }
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      },
    });
  }

  private obtenerFechaLocalIso(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}