import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HorarioService } from '../core/services/horario.service';
import { LaboratorioService } from '../core/services/laboratorio.service';
import { NotifyService } from '../core/services/notify.service';
import { ConfirmService } from '../shared/confirm-dialog';
import { StatusChip } from '../shared/status-chip';
import { PageHeader } from '../shared/page-header';
import { HorarioDialog } from './horario-dialog';
import { AsignacionesDialog } from './asignaciones-dialog';
import {
  ESTADOS_HORARIO,
  EstadoHorario,
  Horario,
  Laboratorio,
} from '../core/models/modelos';

@Component({
  selector: 'app-horarios',
  imports: [
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatMenuModule,
    MatTooltipModule,
    StatusChip,
    PageHeader,
  ],
  template: `
    <app-page-header
      titulo="Horarios y Turnos"
      subtitulo="Programación de sesiones, control de turnos y responsabilidad por puesto">
      <button
        type="button"
        (click)="abrirDialogo()"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer">
        <mat-icon class="text-xl! w-5! h-5!">add</mat-icon>
        <span>Programar Horario</span>
      </button>
    </app-page-header>

    <div class="space-y-4">
      <!-- Filtros -->
      <div class="bg-white px-5 py-4 rounded-xl shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3">
          <mat-form-field appearance="outline" class="w-60 -mb-5">
            <mat-label>Laboratorio</mat-label>
            <mat-select [(ngModel)]="labSeleccionado" (selectionChange)="alCambiarFiltro()">
              <mat-option [value]="null">Todos los laboratorios</mat-option>
              @for (lab of laboratorios(); track lab.id) {
                <mat-option [value]="lab.id">{{ lab.codigo }} — {{ lab.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-44 -mb-5">
            <mat-label>Fecha</mat-label>
            <input matInput type="date" [(ngModel)]="fechaSeleccionada" (change)="alCambiarFiltro()" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-44 -mb-5">
            <mat-label>Estado</mat-label>
            <mat-select [(ngModel)]="estadoSeleccionado" (selectionChange)="alCambiarFiltro()">
              <mat-option [value]="null">Todos</mat-option>
              @for (est of estados; track est) {
                <mat-option [value]="est" class="capitalize">{{ est.replaceAll('_', ' ') }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          @if (labSeleccionado || fechaSeleccionada || estadoSeleccionado) {
            <button mat-button type="button" (click)="limpiarFiltros()" class="text-muted!">
              Limpiar
            </button>
          }
        </div>

        <div class="flex items-center gap-3">
          <span class="text-xs font-medium text-muted bg-slate-100 px-3 py-1.5 rounded-full">
            {{ total() }} {{ total() === 1 ? 'turno' : 'turnos' }}
          </span>
          <button
            mat-icon-button
            type="button"
            matTooltip="Recargar"
            (click)="cargar()"
            [disabled]="cargando()">
            <mat-icon class="text-muted!">refresh</mat-icon>
          </button>
        </div>
      </div>

      <!-- Tabla -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        @if (cargando()) {
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        }

        <div class="overflow-x-auto">
          <table mat-table [dataSource]="datos()" class="w-full min-w-[820px]">
            <ng-container matColumnDef="turno">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Turno / Docente</th>
              <td mat-cell *matCellDef="let el">
                <div class="font-semibold text-ink">{{ el.nombre_turno }}</div>
                <div class="text-xs text-muted">{{ el.docente_responsable }}</div>
              </td>
            </ng-container>

            <ng-container matColumnDef="laboratorio">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Laboratorio</th>
              <td mat-cell *matCellDef="let el">
                <span class="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-ink">
                  {{ nombreLab(el.laboratorio_id) }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="fecha">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Fecha y Horario</th>
              <td mat-cell *matCellDef="let el">
                <div class="text-sm text-ink">{{ el.fecha }}</div>
                <div class="text-xs font-semibold text-primary">
                  {{ el.hora_inicio.slice(0, 5) }} — {{ el.hora_fin.slice(0, 5) }}
                </div>
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
                  matTooltip="Asignar / ver puestos del turno"
                  (click)="abrirAsignaciones(el)">
                  <mat-icon class="text-primary!">assignment_ind</mat-icon>
                </button>

                @if (el.estado === 'programado' || el.estado === 'en_curso') {
                  <button mat-icon-button [matMenuTriggerFor]="menu" matTooltip="Control de turno">
                    <mat-icon class="text-ink!">more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    @if (el.estado === 'programado') {
                      <button mat-menu-item (click)="cambiarEstado(el.id, 'iniciar')">
                        <mat-icon class="text-ok!">play_arrow</mat-icon>
                        <span>Iniciar turno</span>
                      </button>
                      <button mat-menu-item (click)="cambiarEstado(el.id, 'cancelar')">
                        <mat-icon class="text-danger!">cancel</mat-icon>
                        <span>Cancelar turno</span>
                      </button>
                    }
                    @if (el.estado === 'en_curso') {
                      <button mat-menu-item (click)="cambiarEstado(el.id, 'finalizar')">
                        <mat-icon class="text-info!">stop</mat-icon>
                        <span>Finalizar turno</span>
                      </button>
                    }
                  </mat-menu>
                }
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columnas"></tr>
            <tr
              mat-row
              *matRowDef="let row; columns: columnas"
              class="hover:bg-slate-50/80 transition-colors"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell text-center py-12" [attr.colspan]="columnas.length">
                @if (!cargando()) {
                  <div class="flex flex-col items-center gap-2 text-muted">
                    <mat-icon class="text-4xl! w-10! h-10! text-slate-300!">event</mat-icon>
                    <p class="text-sm font-medium text-ink">No hay horarios programados</p>
                    <p class="text-xs">Ajusta los filtros o programa un nuevo turno.</p>
                  </div>
                }
              </td>
            </tr>
          </table>
        </div>

        <mat-paginator
          [length]="total()"
          [pageIndex]="pagina() - 1"
          [pageSize]="tamanoPagina()"
          [pageSizeOptions]="[5, 10, 25, 50]"
          (page)="alPaginar($event)"
          showFirstLastButtons />
      </div>
    </div>
  `,
})
export class Horarios implements OnInit {
  private horarioService = inject(HorarioService);
  private labService = inject(LaboratorioService);
  private dialog = inject(MatDialog);
  private notify = inject(NotifyService);
  private confirm = inject(ConfirmService);

  datos = signal<Horario[]>([]);
  laboratorios = signal<Laboratorio[]>([]);
  total = signal(0);
  pagina = signal(1);
  tamanoPagina = signal(10);
  cargando = signal(false);

  estados = ESTADOS_HORARIO;
  labSeleccionado: number | null = null;
  fechaSeleccionada = '';
  estadoSeleccionado: EstadoHorario | null = null;

  columnas = ['turno', 'laboratorio', 'fecha', 'estado', 'acciones'];

  private mapaLabs = computed(() => {
    const m = new Map<number, string>();
    for (const l of this.laboratorios()) m.set(l.id, l.codigo);
    return m;
  });

  ngOnInit() {
    this.labService.getListadoCompleto().subscribe({
      next: (labs) => this.laboratorios.set(labs),
      error: () => {},
    });
    this.cargar();
  }

  nombreLab(id: number): string {
    return this.mapaLabs().get(id) ?? `Lab #${id}`;
  }

  alCambiarFiltro() {
    this.pagina.set(1);
    this.cargar();
  }

  limpiarFiltros() {
    this.labSeleccionado = null;
    this.fechaSeleccionada = '';
    this.estadoSeleccionado = null;
    this.pagina.set(1);
    this.cargar();
  }

  alPaginar(ev: PageEvent) {
    this.pagina.set(ev.pageIndex + 1);
    this.tamanoPagina.set(ev.pageSize);
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.horarioService
      .getAll({
        laboratorio_id: this.labSeleccionado,
        fecha: this.fechaSeleccionada || null,
        estado: this.estadoSeleccionado,
        pagina: this.pagina(),
        tamano_pagina: this.tamanoPagina(),
      })
      .subscribe({
        next: (res) => {
          this.datos.set(res.items);
          this.total.set(res.total);
          this.cargando.set(false);
        },
        error: (err) => {
          this.cargando.set(false);
          this.notify.error(err);
        },
      });
  }

  abrirDialogo() {
    const ref = this.dialog.open(HorarioDialog, {
      disableClose: true,
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((cambio) => {
      if (cambio) this.cargar();
    });
  }

  abrirAsignaciones(horario: Horario) {
    this.dialog.open(AsignacionesDialog, {
      data: horario,
      maxWidth: '95vw',
    });
  }

  cambiarEstado(id: number, accion: 'iniciar' | 'finalizar' | 'cancelar') {
    const titulos = {
      iniciar: 'Iniciar Turno',
      finalizar: 'Finalizar Turno',
      cancelar: 'Cancelar Turno',
    };
    this.confirm
      .pedir({
        titulo: titulos[accion],
        mensaje: `¿Confirmas que deseas ${accion} este turno?`,
        textoConfirmar: 'Sí, confirmar',
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.horarioService[accion](id).subscribe({
          next: () => {
            this.notify.ok('Estado del turno actualizado');
            this.cargar();
          },
          error: (err) => this.notify.error(err),
        });
      });
  }
}