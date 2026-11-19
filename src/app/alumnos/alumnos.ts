import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AlumnoService } from '../core/services/alumno.service';
import { MatriculaService } from '../core/services/matricula.service';
import { HorarioService } from '../core/services/horario.service';
import { AuthService } from '../core/services/auth.service';
import { NotifyService } from '../core/services/notify.service';
import { ConfirmService } from '../shared/confirm-dialog';
import { StatusChip } from '../shared/status-chip';
import { PageHeader } from '../shared/page-header';
import { AlumnoDialog } from './alumno-dialog';
import { HistorialAlumnoDialog } from './historial-alumno-dialog';
import { CargaExcelDialog } from './carga-excel-dialog';
import {
  Alumno,
  ESTADOS_ALUMNO,
  EstadoAlumno,
  Horario,
  Matricula,
} from '../core/models/modelos';

@Component({
  selector: 'app-alumnos',
  imports: [
    DatePipe,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    StatusChip,
    PageHeader,
  ],
  template: `
    <app-page-header
      titulo="Alumnos y Matrículas"
      subtitulo="Directorio estudiantil, matrículas por turno e historial de responsabilidad">
      <div class="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          (click)="abrirCargaExcel()"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-ink text-sm font-semibold shadow-xs transition-colors cursor-pointer">
          <mat-icon class="text-xl! w-5! h-5! text-ok!">upload_file</mat-icon>
          <span>Cargar Excel</span>
        </button>

        <button
          type="button"
          (click)="abrirDialogoAlumno()"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer">
          <mat-icon class="text-xl! w-5! h-5!">person_add</mat-icon>
          <span>Nuevo Alumno</span>
        </button>
      </div>
    </app-page-header>

    <!-- Selector de pestañas -->
    <div class="inline-flex p-1 rounded-xl bg-slate-200/70 mb-5">
      <button
        type="button"
        (click)="cambiarPestana('directorio')"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer"
        [class.bg-white]="pestana() === 'directorio'"
        [class.text-ink]="pestana() === 'directorio'"
        [class.shadow-xs]="pestana() === 'directorio'"
        [class.text-muted]="pestana() !== 'directorio'">
        <mat-icon class="text-lg! w-5! h-5!">school</mat-icon>
        <span>Directorio de Alumnos</span>
      </button>

      <button
        type="button"
        (click)="cambiarPestana('matriculas')"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer"
        [class.bg-white]="pestana() === 'matriculas'"
        [class.text-ink]="pestana() === 'matriculas'"
        [class.shadow-xs]="pestana() === 'matriculas'"
        [class.text-muted]="pestana() !== 'matriculas'">
        <mat-icon class="text-lg! w-5! h-5!">fact_check</mat-icon>
        <span>Matrículas por Turno</span>
      </button>
    </div>

    <!-- PESTAÑA 1: DIRECTORIO DE ALUMNOS -->
    @if (pestana() === 'directorio') {
      <div class="space-y-4">
        <div class="bg-white px-5 py-4 rounded-xl shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-wrap items-center gap-3 flex-1">
            <mat-form-field appearance="outline" class="w-full sm:w-64 -mb-5">
              <mat-label>Buscar código, nombre o correo</mat-label>
              <mat-icon matPrefix class="mr-1.5 text-muted!">search</mat-icon>
              <input
                matInput
                [(ngModel)]="busqueda"
                (keyup.enter)="alFiltrarAlumnos()"
                placeholder="Presiona Enter para buscar" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full sm:w-52 -mb-5">
              <mat-label>Carrera</mat-label>
              <input
                matInput
                [(ngModel)]="carreraFiltro"
                (keyup.enter)="alFiltrarAlumnos()"
                placeholder="Ej. Sistemas" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-40 -mb-5">
              <mat-label>Estado</mat-label>
              <mat-select [(ngModel)]="estadoFiltro" (selectionChange)="alFiltrarAlumnos()">
                <mat-option [value]="null">Todos</mat-option>
                @for (est of estados; track est) {
                  <mat-option [value]="est" class="capitalize">{{ est }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <button
              type="button"
              (click)="alFiltrarAlumnos()"
              class="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-ink text-xs font-semibold cursor-pointer">
              Buscar
            </button>

            @if (busqueda || carreraFiltro || estadoFiltro) {
              <button mat-button type="button" (click)="limpiarFiltrosAlumnos()" class="text-muted!">
                Limpiar
              </button>
            }
          </div>

          <div class="flex items-center gap-3">
            <span class="text-xs font-medium text-muted bg-slate-100 px-3 py-1.5 rounded-full">
              {{ totalAlumnos() }} {{ totalAlumnos() === 1 ? 'alumno' : 'alumnos' }}
            </span>
            <button
              mat-icon-button
              type="button"
              matTooltip="Recargar"
              (click)="cargarAlumnos()"
              [disabled]="cargandoAlumnos()">
              <mat-icon class="text-muted!">refresh</mat-icon>
            </button>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
          @if (cargandoAlumnos()) {
            <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          }

          <div class="overflow-x-auto">
            <table mat-table [dataSource]="alumnos()" class="w-full min-w-[900px]">
              <ng-container matColumnDef="codigo">
                <th mat-header-cell *matHeaderCellDef class="font-semibold!">Código</th>
                <td mat-cell *matCellDef="let el">
                  <div class="font-bold font-mono text-sm text-ink">{{ el.codigo }}</div>
                  @if (el.numero_documento) {
                    <div class="text-[11px] text-muted uppercase">
                      {{ el.tipo_documento.replaceAll('_', ' ') }}: {{ el.numero_documento }}
                    </div>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="estudiante">
                <th mat-header-cell *matHeaderCellDef class="font-semibold!">Estudiante</th>
                <td mat-cell *matCellDef="let el" class="py-3!">
                  <div class="font-semibold text-ink">{{ el.apellidos }}, {{ el.nombres }}</div>
                  <div class="text-xs text-muted">{{ el.correo_institucional }}</div>
                </td>
              </ng-container>

              <ng-container matColumnDef="carrera">
                <th mat-header-cell *matHeaderCellDef class="font-semibold!">Carrera / Ciclo</th>
                <td mat-cell *matCellDef="let el" class="text-sm">
                  <div class="text-ink font-medium">{{ el.carrera }}</div>
                  <div class="text-xs text-muted">
                    @if (el.semestre) { Ciclo {{ el.semestre }} }
                    @if (el.semestre && el.grupo) { · }
                    @if (el.grupo) { Grupo {{ el.grupo }} }
                    @if (!el.semestre && !el.grupo) { — }
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="contacto">
                <th mat-header-cell *matHeaderCellDef class="font-semibold!">Teléfono</th>
                <td mat-cell *matCellDef="let el" class="text-sm text-muted">
                  {{ el.telefono || '—' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef class="font-semibold!">Estado</th>
                <td mat-cell *matCellDef="let el">
                  <app-status-chip [valor]="el.estado" />
                </td>
              </ng-container>

              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef class="text-right! font-semibold!">Acciones</th>
                <td mat-cell *matCellDef="let el" class="text-right!">
                  <button
                    mat-icon-button
                    matTooltip="Ver historial de workstations"
                    (click)="abrirHistorial(el)">
                    <mat-icon class="text-info!">history</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    matTooltip="Editar alumno"
                    (click)="abrirDialogoAlumno(el)">
                    <mat-icon class="text-primary!">edit</mat-icon>
                  </button>
                  @if (puedeEliminar()) {
                    <button
                      mat-icon-button
                      matTooltip="Eliminar alumno"
                      (click)="eliminarAlumno(el)">
                      <mat-icon class="text-danger!">delete</mat-icon>
                    </button>
                  }
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columnasAlumnos"></tr>
              <tr
                mat-row
                *matRowDef="let row; columns: columnasAlumnos"
                class="hover:bg-slate-50/80 transition-colors"></tr>

              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell text-center py-12" [attr.colspan]="columnasAlumnos.length">
                  @if (!cargandoAlumnos()) {
                    <div class="flex flex-col items-center gap-2 text-muted">
                      <mat-icon class="text-4xl! w-10! h-10! text-slate-300!">school</mat-icon>
                      <p class="text-sm font-medium text-ink">No se encontraron alumnos</p>
                      <p class="text-xs">Registra un alumno manualmente o importa una lista desde Excel.</p>
                    </div>
                  }
                </td>
              </tr>
            </table>
          </div>

          <mat-paginator
            [length]="totalAlumnos()"
            [pageIndex]="paginaAlumnos() - 1"
            [pageSize]="tamanoAlumnos()"
            [pageSizeOptions]="[5, 10, 25, 50]"
            (page)="alPaginarAlumnos($event)"
            showFirstLastButtons />
        </div>
      </div>
    }

    <!-- PESTAÑA 2: MATRÍCULAS POR TURNO -->
    @if (pestana() === 'matriculas') {
      <div class="space-y-4">
        <div class="bg-white px-5 py-4 rounded-xl shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-wrap items-center gap-3">
            <mat-form-field appearance="outline" class="w-full sm:w-96 -mb-5">
              <mat-label>Seleccionar Horario / Turno</mat-label>
              <mat-select
                [ngModel]="horarioSeleccionado()"
                (ngModelChange)="alSeleccionarHorario($event)">
                @for (h of horarios(); track h.id) {
                  <mat-option [value]="h.id">
                    {{ h.nombre_turno }} — {{ h.fecha }} ({{ h.hora_inicio.slice(0, 5) }})
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            @if (horarioSeleccionado()) {
              <button
                type="button"
                (click)="abrirCargaExcel(horarioSeleccionado())"
                class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-ok-bg hover:bg-green-200/70 text-ok text-xs font-semibold transition-colors cursor-pointer">
                <mat-icon class="text-base! w-4! h-4!">upload_file</mat-icon>
                <span>Importar Excel a este turno</span>
              </button>
            }
          </div>

          <div class="flex items-center gap-3">
            <span class="text-xs font-medium text-muted bg-slate-100 px-3 py-1.5 rounded-full">
              {{ totalMatriculas() }} {{ totalMatriculas() === 1 ? 'matriculado' : 'matriculados' }}
            </span>
            <button
              mat-icon-button
              type="button"
              matTooltip="Recargar"
              (click)="cargarMatriculas()"
              [disabled]="cargandoMatriculas()">
              <mat-icon class="text-muted!">refresh</mat-icon>
            </button>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
          @if (cargandoMatriculas()) {
            <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          }

          <div class="overflow-x-auto">
            <table mat-table [dataSource]="matriculas()" class="w-full min-w-[760px]">
              <ng-container matColumnDef="alumno">
                <th mat-header-cell *matHeaderCellDef class="font-semibold!">Alumno</th>
                <td mat-cell *matCellDef="let el" class="py-3!">
                  @if (el.alumno) {
                    <div class="font-semibold text-ink">
                      {{ el.alumno.apellidos }}, {{ el.alumno.nombres }}
                    </div>
                    <div class="text-xs text-muted">
                      <span class="font-mono font-semibold text-primary">{{ el.alumno.codigo }}</span>
                      · {{ el.alumno.correo_institucional }}
                    </div>
                  } @else {
                    <span class="font-mono text-sm text-ink">Alumno #{{ el.alumno_id }}</span>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="carrera">
                <th mat-header-cell *matHeaderCellDef class="font-semibold!">Carrera</th>
                <td mat-cell *matCellDef="let el" class="text-sm text-muted">
                  {{ el.alumno?.carrera || '—' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="fecha">
                <th mat-header-cell *matHeaderCellDef class="font-semibold!">Fecha Matrícula</th>
                <td mat-cell *matCellDef="let el" class="text-xs text-muted">
                  {{ el.fecha_matricula | date: 'dd/MM/yyyy HH:mm' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef class="font-semibold!">Estado</th>
                <td mat-cell *matCellDef="let el">
                  <app-status-chip [valor]="el.estado" />
                </td>
              </ng-container>

              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef class="text-right! font-semibold!">Acciones</th>
                <td mat-cell *matCellDef="let el" class="text-right!">
                  @if (el.alumno) {
                    <button
                      mat-icon-button
                      matTooltip="Ver historial de workstations"
                      (click)="abrirHistorial(el.alumno)">
                      <mat-icon class="text-info!">history</mat-icon>
                    </button>
                  }
                  <button
                    mat-icon-button
                    matTooltip="Retirar matrícula del turno"
                    (click)="eliminarMatricula(el)">
                    <mat-icon class="text-danger!">person_remove</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columnasMatriculas"></tr>
              <tr
                mat-row
                *matRowDef="let row; columns: columnasMatriculas"
                class="hover:bg-slate-50/80 transition-colors"></tr>

              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell text-center py-12" [attr.colspan]="columnasMatriculas.length">
                  @if (!cargandoMatriculas()) {
                    <div class="flex flex-col items-center gap-2 text-muted">
                      <mat-icon class="text-4xl! w-10! h-10! text-slate-300!">fact_check</mat-icon>
                      <p class="text-sm font-medium text-ink">
                        @if (!horarioSeleccionado()) {
                          No hay horarios programados todavía
                        } @else {
                          No hay alumnos matriculados en este turno
                        }
                      </p>
                      @if (horarioSeleccionado()) {
                        <p class="text-xs">Usa "Importar Excel a este turno" para cargar la lista de clase.</p>
                      }
                    </div>
                  }
                </td>
              </tr>
            </table>
          </div>

          <mat-paginator
            [length]="totalMatriculas()"
            [pageIndex]="paginaMatriculas() - 1"
            [pageSize]="tamanoMatriculas()"
            [pageSizeOptions]="[5, 10, 25, 50]"
            (page)="alPaginarMatriculas($event)"
            showFirstLastButtons />
        </div>
      </div>
    }
  `,
})
export class Alumnos implements OnInit {
  private alumnoService = inject(AlumnoService);
  private matriculaService = inject(MatriculaService);
  private horarioService = inject(HorarioService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private notify = inject(NotifyService);
  private confirm = inject(ConfirmService);

  pestana = signal<'directorio' | 'matriculas'>('directorio');

  // Estado pestaña 1: Directorio
  alumnos = signal<Alumno[]>([]);
  totalAlumnos = signal(0);
  paginaAlumnos = signal(1);
  tamanoAlumnos = signal(10);
  cargandoAlumnos = signal(false);

  estados = ESTADOS_ALUMNO;
  busqueda = '';
  carreraFiltro = '';
  estadoFiltro: EstadoAlumno | null = null;
  columnasAlumnos = ['codigo', 'estudiante', 'carrera', 'contacto', 'estado', 'acciones'];

  // Estado pestaña 2: Matrículas por turno
  horarios = signal<Horario[]>([]);
  horarioSeleccionado = signal<number | null>(null);
  matriculas = signal<Matricula[]>([]);
  totalMatriculas = signal(0);
  paginaMatriculas = signal(1);
  tamanoMatriculas = signal(10);
  cargandoMatriculas = signal(false);
  columnasMatriculas = ['alumno', 'carrera', 'fecha', 'estado', 'acciones'];

  puedeEliminar = computed(() => this.auth.tieneRol('admin', 'gestion_laboratorios'));

  ngOnInit() {
    this.cargarAlumnos();
    this.cargarHorarios();
  }

  cambiarPestana(tab: 'directorio' | 'matriculas') {
    this.pestana.set(tab);
    if (tab === 'matriculas' && this.horarioSeleccionado()) {
      this.cargarMatriculas();
    }
  }

  // ===== Directorio de Alumnos =====
  alFiltrarAlumnos() {
    this.paginaAlumnos.set(1);
    this.cargarAlumnos();
  }

  limpiarFiltrosAlumnos() {
    this.busqueda = '';
    this.carreraFiltro = '';
    this.estadoFiltro = null;
    this.paginaAlumnos.set(1);
    this.cargarAlumnos();
  }

  alPaginarAlumnos(ev: PageEvent) {
    this.paginaAlumnos.set(ev.pageIndex + 1);
    this.tamanoAlumnos.set(ev.pageSize);
    this.cargarAlumnos();
  }

  cargarAlumnos() {
    this.cargandoAlumnos.set(true);
    this.alumnoService
      .getAll({
        busqueda: this.busqueda,
        carrera: this.carreraFiltro,
        estado: this.estadoFiltro,
        pagina: this.paginaAlumnos(),
        tamano_pagina: this.tamanoAlumnos(),
      })
      .subscribe({
        next: (res) => {
          this.alumnos.set(res.items);
          this.totalAlumnos.set(res.total);
          this.cargandoAlumnos.set(false);
        },
        error: (err) => {
          this.cargandoAlumnos.set(false);
          this.notify.error(err);
        },
      });
  }

  abrirDialogoAlumno(alumno?: Alumno) {
    const ref = this.dialog.open(AlumnoDialog, {
      data: alumno ?? null,
      disableClose: true,
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((cambio) => {
      if (cambio) this.cargarAlumnos();
    });
  }

  abrirHistorial(alumno: Alumno) {
    this.dialog.open(HistorialAlumnoDialog, {
      data: alumno,
      maxWidth: '95vw',
    });
  }

  eliminarAlumno(alumno: Alumno) {
    this.confirm
      .pedir({
        titulo: 'Eliminar Alumno',
        mensaje: `¿Estás seguro de eliminar a ${alumno.apellidos}, ${alumno.nombres} (${alumno.codigo})?`,
        textoConfirmar: 'Eliminar',
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.alumnoService.delete(alumno.id).subscribe({
          next: () => {
            this.notify.ok('Alumno eliminado correctamente');
            if (this.alumnos().length === 1 && this.paginaAlumnos() > 1) {
              this.paginaAlumnos.update((p) => p - 1);
            }
            this.cargarAlumnos();
          },
          error: (err) => this.notify.error(err),
        });
      });
  }

  // ===== Matrículas por Turno =====
  private cargarHorarios() {
    this.horarioService.getAll({ pagina: 1, tamano_pagina: 100 }).subscribe({
      next: (res) => {
        this.horarios.set(res.items);
        if (res.items.length > 0 && !this.horarioSeleccionado()) {
          this.horarioSeleccionado.set(res.items[0].id);
        }
      },
      error: () => {},
    });
  }

  alSeleccionarHorario(horarioId: number | null) {
    this.horarioSeleccionado.set(horarioId);
    this.paginaMatriculas.set(1);
    this.cargarMatriculas();
  }

  alPaginarMatriculas(ev: PageEvent) {
    this.paginaMatriculas.set(ev.pageIndex + 1);
    this.tamanoMatriculas.set(ev.pageSize);
    this.cargarMatriculas();
  }

  cargarMatriculas() {
    const horarioId = this.horarioSeleccionado();
    if (!horarioId) {
      this.matriculas.set([]);
      this.totalMatriculas.set(0);
      return;
    }

    this.cargandoMatriculas.set(true);
    this.matriculaService
      .getPorHorario(horarioId, {
        pagina: this.paginaMatriculas(),
        tamano_pagina: this.tamanoMatriculas(),
      })
      .subscribe({
        next: (res) => {
          this.matriculas.set(res.items);
          this.totalMatriculas.set(res.total);
          this.cargandoMatriculas.set(false);
        },
        error: (err) => {
          this.cargandoMatriculas.set(false);
          this.notify.error(err);
        },
      });
  }

  abrirCargaExcel(horarioId?: number | null) {
    const ref = this.dialog.open(CargaExcelDialog, {
      data: { horarioId: horarioId ?? this.horarioSeleccionado() },
      disableClose: true,
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((huboCambios) => {
      if (huboCambios) {
        this.cargarAlumnos();
        if (this.horarioSeleccionado()) {
          this.cargarMatriculas();
        }
      }
    });
  }

  eliminarMatricula(m: Matricula) {
    const nombre = m.alumno ? `${m.alumno.apellidos}, ${m.alumno.nombres}` : `Alumno #${m.alumno_id}`;
    this.confirm
      .pedir({
        titulo: 'Retirar Matrícula',
        mensaje: `¿Confirmas retirar a ${nombre} de este turno? El alumno permanecerá en el directorio general.`,
        textoConfirmar: 'Retirar',
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.matriculaService.delete(m.id).subscribe({
          next: () => {
            this.notify.ok('Matrícula retirada correctamente');
            if (this.matriculas().length === 1 && this.paginaMatriculas() > 1) {
              this.paginaMatriculas.update((p) => p - 1);
            }
            this.cargarMatriculas();
          },
          error: (err) => this.notify.error(err),
        });
      });
  }
}