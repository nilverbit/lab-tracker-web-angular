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
import { MatTooltipModule } from '@angular/material/tooltip';

import { WorkstationService } from '../core/services/workstation.service';
import { LaboratorioService } from '../core/services/laboratorio.service';
import { NotifyService } from '../core/services/notify.service';
import { ConfirmService } from '../shared/confirm-dialog';
import { StatusChip } from '../shared/status-chip';
import { PageHeader } from '../shared/page-header';
import { PuestoDialog } from './puesto-dialog';
import { Laboratorio, Workstation } from '../core/models/modelos';

@Component({
  selector: 'app-puestos',
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
    MatTooltipModule,
    StatusChip,
    PageHeader,
  ],
  template: `
    <app-page-header
      titulo="Puestos de Trabajo"
      subtitulo="Administración de mesas y estaciones (workstations) por laboratorio">
      <button
        type="button"
        (click)="abrirDialogo()"
        [disabled]="!labSeleccionado()"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
        <mat-icon class="text-xl! w-5! h-5!">add</mat-icon>
        <span>Nuevo Puesto</span>
      </button>
    </app-page-header>

    <div class="space-y-4">
      <!-- Selector de laboratorio -->
      <div class="bg-white px-5 py-4 rounded-xl shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <mat-form-field appearance="outline" class="w-full sm:w-80 -mb-5">
          <mat-label>Laboratorio</mat-label>
          <mat-select
            [ngModel]="labSeleccionado()"
            (ngModelChange)="alSeleccionarLab($event)">
            @for (lab of laboratorios(); track lab.id) {
              <mat-option [value]="lab.id">{{ lab.codigo }} — {{ lab.nombre }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (labActual(); as lab) {
          <div class="flex items-center gap-3">
            <span class="text-xs font-medium text-muted bg-slate-100 px-3 py-1.5 rounded-full">
              Registrados: <strong class="text-ink">{{ total() }}</strong> / {{ lab.capacidad_workstations }} puestos
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
        }
      </div>

      <!-- Tabla -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        @if (cargando()) {
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        }

        <div class="overflow-x-auto">
          <table mat-table [dataSource]="datos()" class="w-full">
            <ng-container matColumnDef="codigo">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Código</th>
              <td mat-cell *matCellDef="let el">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-slate-100 text-ink flex items-center justify-center">
                    <mat-icon class="text-lg! w-5! h-5!">desktop_windows</mat-icon>
                  </div>
                  <span class="font-bold font-mono text-sm text-ink">{{ el.codigo }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="ubicacion">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Ubicación Interna</th>
              <td mat-cell *matCellDef="let el" class="text-muted text-sm">{{ el.ubicacion_interna }}</td>
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
                <button mat-icon-button matTooltip="Editar puesto" (click)="abrirDialogo(el)">
                  <mat-icon class="text-primary!">edit</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Eliminar puesto" (click)="eliminar(el)">
                  <mat-icon class="text-danger!">delete</mat-icon>
                </button>
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
                    <mat-icon class="text-4xl! w-10! h-10! text-slate-300!">desktop_windows</mat-icon>
                    <p class="text-sm font-medium text-ink">
                      @if (!labSeleccionado()) {
                        No hay laboratorios registrados todavía
                      } @else {
                        Sin puestos registrados en este laboratorio
                      }
                    </p>
                    <p class="text-xs">
                      @if (labSeleccionado()) {
                        Usa "Nuevo Puesto" para agregar estaciones a este ambiente.
                      }
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
export class Puestos implements OnInit {
  private wsService = inject(WorkstationService);
  private labService = inject(LaboratorioService);
  private dialog = inject(MatDialog);
  private notify = inject(NotifyService);
  private confirm = inject(ConfirmService);

  datos = signal<Workstation[]>([]);
  laboratorios = signal<Laboratorio[]>([]);
  labSeleccionado = signal<number | null>(null);
  total = signal(0);
  pagina = signal(1);
  tamanoPagina = signal(10);
  cargando = signal(false);

  columnas = ['codigo', 'ubicacion', 'estado', 'acciones'];

  labActual = computed(() =>
    this.laboratorios().find((l) => l.id === this.labSeleccionado()) ?? null
  );

  ngOnInit() {
    this.labService.getListadoCompleto().subscribe({
      next: (labs) => {
        this.laboratorios.set(labs);
        if (labs.length > 0) {
          this.labSeleccionado.set(labs[0].id);
          this.cargar();
        }
      },
      error: (err) => this.notify.error(err),
    });
  }

  alSeleccionarLab(labId: number | null) {
    this.labSeleccionado.set(labId);
    this.pagina.set(1);
    this.cargar();
  }

  alPaginar(ev: PageEvent) {
    this.pagina.set(ev.pageIndex + 1);
    this.tamanoPagina.set(ev.pageSize);
    this.cargar();
  }

  cargar() {
    const labId = this.labSeleccionado();
    if (!labId) {
      this.datos.set([]);
      this.total.set(0);
      return;
    }

    this.cargando.set(true);
    this.wsService
      .getByLaboratorio(labId, {
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

  abrirDialogo(puesto?: Workstation) {
    const labId = this.labSeleccionado();
    if (!labId) return;
    const lab = this.labActual();
    const ref = this.dialog.open(PuestoDialog, {
      data: {
        puesto,
        laboratorio_id: labId,
        laboratorio_nombre: lab ? `${lab.codigo} — ${lab.nombre}` : undefined,
      },
      disableClose: true,
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((cambio) => {
      if (cambio) this.cargar();
    });
  }

  eliminar(puesto: Workstation) {
    this.confirm
      .pedir({
        titulo: 'Eliminar Puesto',
        mensaje: `¿Seguro de eliminar el puesto ${puesto.codigo}? Sus equipos asignados quedarán sin puesto.`,
        textoConfirmar: 'Eliminar',
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.wsService.delete(puesto.id).subscribe({
          next: () => {
            this.notify.ok('Puesto eliminado correctamente');
            if (this.datos().length === 1 && this.pagina() > 1) {
              this.pagina.update((p) => p - 1);
            }
            this.cargar();
          },
          error: (err) => this.notify.error(err),
        });
      });
  }
}