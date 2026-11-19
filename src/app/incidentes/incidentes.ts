import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

import { IncidenteService } from '../core/services/incidente.service';
import { EquipoService } from '../core/services/equipo.service';
import { AuthService } from '../core/services/auth.service';
import { NotifyService } from '../core/services/notify.service';
import { StatusChip } from '../shared/status-chip';
import { PageHeader } from '../shared/page-header';
import { IncidenteDialog } from './incidente-dialog';
import { Equipo, Incidente } from '../core/models/modelos';

@Component({
  selector: 'app-incidentes',
  imports: [
    DatePipe,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSlideToggleModule,
    MatTooltipModule,
    StatusChip,
    PageHeader,
  ],
  template: `
    <app-page-header
      titulo="Incidentes y Mantenimiento"
      subtitulo="Registro de fallas, seguimiento técnico y resolución de incidencias">
      <button
        type="button"
        (click)="abrirDialogo()"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer">
        <mat-icon class="text-xl! w-5! h-5!">add_alert</mat-icon>
        <span>Reportar Incidente</span>
      </button>
    </app-page-header>

    <div class="space-y-4">
      <!-- Barra de filtros -->
      <div class="bg-white px-5 py-3.5 rounded-xl shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <mat-slide-toggle
          [(ngModel)]="soloPendientes"
          (change)="alCambiarFiltro()"
          color="primary">
          <span class="text-sm font-medium text-ink">Mostrar solo pendientes / sin resolver</span>
        </mat-slide-toggle>

        <div class="flex items-center gap-3">
          <span class="text-xs font-medium text-muted bg-slate-100 px-3 py-1.5 rounded-full">
            {{ total() }} {{ total() === 1 ? 'incidente' : 'incidentes' }}
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
          <table mat-table [dataSource]="datos()" class="w-full min-w-[880px]">
            <ng-container matColumnDef="detalle">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Incidente</th>
              <td mat-cell *matCellDef="let el" class="py-3!">
                <div class="font-medium text-ink max-w-md">{{ el.descripcion }}</div>
                <div class="text-xs text-muted mt-0.5 flex flex-wrap items-center gap-2">
                  <span>Reportado por: <strong class="text-ink">{{ el.reportado_por }}</strong></span>
                  @if (el.url_imagenes?.length) {
                    <a
                      [href]="el.url_imagenes[0]"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1 text-primary hover:underline">
                      <mat-icon class="text-sm! w-4! h-4!">photo</mat-icon>
                      {{ el.url_imagenes.length }} evidencia(s)
                    </a>
                  }
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="activo">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Activo Afectado</th>
              <td mat-cell *matCellDef="let el" class="text-sm">
                @if (el.equipo_id) {
                  <div class="font-mono text-xs font-semibold text-ink">
                    {{ codigoEquipo(el.equipo_id) }}
                  </div>
                }
                @if (el.workstation_id) {
                  <div class="text-xs text-muted">Puesto #{{ el.workstation_id }}</div>
                }
                @if (!el.equipo_id && !el.workstation_id) {
                  <span class="text-xs text-slate-400">General</span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="prioridad">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Prioridad</th>
              <td mat-cell *matCellDef="let el">
                <app-status-chip [valor]="el.prioridad" />
              </td>
            </ng-container>

            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Estado</th>
              <td mat-cell *matCellDef="let el">
                <app-status-chip [valor]="el.estado" />
              </td>
            </ng-container>

            <ng-container matColumnDef="fecha">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Fechas</th>
              <td mat-cell *matCellDef="let el" class="text-xs text-muted">
                <div>Reporte: <span class="text-ink">{{ el.fecha_reporte | date: 'dd/MM/yy HH:mm' }}</span></div>
                @if (el.fecha_resolucion) {
                  <div class="text-ok">Resuelto: {{ el.fecha_resolucion | date: 'dd/MM/yy HH:mm' }}</div>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef class="text-right! font-semibold!">Atención</th>
              <td mat-cell *matCellDef="let el" class="text-right!">
                <button
                  mat-icon-button
                  matTooltip="Actualizar estado / evidencias"
                  (click)="abrirDialogo(el)">
                  <mat-icon class="text-primary!">build</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columnas()"></tr>
            <tr
              mat-row
              *matRowDef="let row; columns: columnas()"
              class="hover:bg-slate-50/80 transition-colors"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell text-center py-12" [attr.colspan]="columnas().length">
                @if (!cargando()) {
                  <div class="flex flex-col items-center gap-2 text-muted">
                    <mat-icon class="text-4xl! w-10! h-10! text-slate-300!">check_circle</mat-icon>
                    <p class="text-sm font-medium text-ink">No hay incidentes registrados</p>
                    <p class="text-xs">
                      {{ soloPendientes ? 'No existen incidencias pendientes en este momento.' : 'Todo opera con normalidad.' }}
                    </p>
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
export class Incidentes implements OnInit {
  private incidenteService = inject(IncidenteService);
  private equipoService = inject(EquipoService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private notify = inject(NotifyService);

  datos = signal<Incidente[]>([]);
  equipos = signal<Equipo[]>([]);
  total = signal(0);
  pagina = signal(1);
  tamanoPagina = signal(10);
  cargando = signal(false);
  soloPendientes = false;

  puedeAtender = computed(() => this.auth.tieneRol('admin', 'gestion_laboratorios'));

  columnas = computed(() =>
    this.puedeAtender()
      ? ['detalle', 'activo', 'prioridad', 'estado', 'fecha', 'acciones']
      : ['detalle', 'activo', 'prioridad', 'estado', 'fecha']
  );

  private mapaEquipos = computed(() => {
    const m = new Map<number, string>();
    for (const e of this.equipos()) m.set(e.id, e.codigo_patrimonial);
    return m;
  });

  ngOnInit() {
    this.equipoService.getListadoCompleto().subscribe({
      next: (eq) => this.equipos.set(eq),
      error: () => {},
    });
    this.cargar();
  }

  codigoEquipo(id: number): string {
    return this.mapaEquipos().get(id) ?? `Equipo #${id}`;
  }

  alCambiarFiltro() {
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
    this.incidenteService
      .getAll({
        solo_pendientes: this.soloPendientes,
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

  abrirDialogo(incidente?: Incidente) {
    const ref = this.dialog.open(IncidenteDialog, {
      data: incidente ?? null,
      disableClose: true,
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((cambio) => {
      if (cambio) this.cargar();
    });
  }
}