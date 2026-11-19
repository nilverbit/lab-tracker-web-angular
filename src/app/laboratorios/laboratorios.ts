import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LaboratorioService } from '../core/services/laboratorio.service';
import { AuthService } from '../core/services/auth.service';
import { NotifyService } from '../core/services/notify.service';
import { ConfirmService } from '../shared/confirm-dialog';
import { StatusChip } from '../shared/status-chip';
import { PageHeader } from '../shared/page-header';
import { LaboratorioDialog } from './laboratorio-dialog';
import { Laboratorio } from '../core/models/modelos';

@Component({
  selector: 'app-laboratorios',
  imports: [
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
      titulo="Laboratorios"
      subtitulo="Gestión de ambientes de cómputo, capacidad y disponibilidad">
      @if (puedeGestionar()) {
        <button
          type="button"
          (click)="abrirDialogo()"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer">
          <mat-icon class="text-xl! w-5! h-5!">add</mat-icon>
          <span>Nuevo Laboratorio</span>
        </button>
      }
    </app-page-header>

    <div class="mt-6 space-y-4">
      <!-- Barra de filtros y resumen -->
      <div class="bg-white px-5 py-3.5 rounded-xl shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <mat-slide-toggle
            [(ngModel)]="soloDisponibles"
            (change)="alCambiarFiltro()"
            color="primary">
            <span class="text-sm text-ink font-medium">Mostrar solo disponibles</span>
          </mat-slide-toggle>
        </div>

        <div class="flex items-center gap-3">
          <span class="text-xs font-medium text-muted bg-slate-100 px-3 py-1.5 rounded-full">
            {{ total() }} {{ total() === 1 ? 'laboratorio' : 'laboratorios' }}
          </span>
          <button
            mat-icon-button
            type="button"
            matTooltip="Recargar lista"
            (click)="cargar()"
            [disabled]="cargando()">
            <mat-icon class="text-muted!">refresh</mat-icon>
          </button>
        </div>
      </div>

      <!-- Tabla + Paginador -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        @if (cargando()) {
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        }

        <div class="overflow-x-auto">
          <table mat-table [dataSource]="datos()" class="w-full">
            <ng-container matColumnDef="codigo">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Código</th>
              <td mat-cell *matCellDef="let el">
                <div class="flex items-center gap-3 py-1">
                  @if (el.url_imagen) {
                    <img
                      [src]="el.url_imagen"
                      [alt]="el.nombre"
                      class="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                  } @else {
                    <div class="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <mat-icon class="text-xl! w-5! h-5!">science</mat-icon>
                    </div>
                  }
                  <span class="font-bold text-ink font-mono text-sm">{{ el.codigo }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="nombre">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Nombre</th>
              <td mat-cell *matCellDef="let el" class="font-medium text-ink">{{ el.nombre }}</td>
            </ng-container>

            <ng-container matColumnDef="ubicacion">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Ubicación</th>
              <td mat-cell *matCellDef="let el" class="text-muted text-sm">{{ el.ubicacion }}</td>
            </ng-container>

            <ng-container matColumnDef="capacidad">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Capacidad</th>
              <td mat-cell *matCellDef="let el">
                <span class="inline-flex items-center gap-1.5 text-sm text-ink">
                  <mat-icon class="text-base! w-4! h-4! text-muted!">desktop_windows</mat-icon>
                  {{ el.capacidad_workstations }} puestos
                </span>
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
                  matTooltip="Editar laboratorio"
                  (click)="abrirDialogo(el)">
                  <mat-icon class="text-primary!">edit</mat-icon>
                </button>
                <button
                  mat-icon-button
                  matTooltip="Eliminar laboratorio"
                  (click)="eliminar(el)">
                  <mat-icon class="text-danger!">delete</mat-icon>
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
                    <mat-icon class="text-4xl! w-10! h-10! text-slate-300!">science</mat-icon>
                    <p class="text-sm font-medium text-ink">No hay laboratorios para mostrar</p>
                    <p class="text-xs">
                      {{ soloDisponibles ? 'Prueba desactivando el filtro de disponibles.' : 'Registra el primer laboratorio para comenzar.' }}
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
export class Laboratorios implements OnInit {
  private labService = inject(LaboratorioService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private notify = inject(NotifyService);
  private confirm = inject(ConfirmService);

  datos = signal<Laboratorio[]>([]);
  total = signal(0);
  pagina = signal(1);
  tamanoPagina = signal(10);
  cargando = signal(false);
  soloDisponibles = false;

  puedeGestionar = computed(() => this.auth.tieneRol('admin', 'gestion_laboratorios'));

  columnas = computed(() =>
    this.puedeGestionar()
      ? ['codigo', 'nombre', 'ubicacion', 'capacidad', 'estado', 'acciones']
      : ['codigo', 'nombre', 'ubicacion', 'capacidad', 'estado']
  );

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.labService
      .getAll({
        solo_disponibles: this.soloDisponibles,
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

  alCambiarFiltro() {
    this.pagina.set(1);
    this.cargar();
  }

  alPaginar(ev: PageEvent) {
    this.pagina.set(ev.pageIndex + 1);
    this.tamanoPagina.set(ev.pageSize);
    this.cargar();
  }

  abrirDialogo(lab?: Laboratorio) {
    const ref = this.dialog.open(LaboratorioDialog, {
      data: lab ?? null,
      disableClose: true,
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((cambio) => {
      if (cambio) this.cargar();
    });
  }

  eliminar(lab: Laboratorio) {
    this.confirm
      .pedir({
        titulo: 'Eliminar Laboratorio',
        mensaje: `¿Estás seguro de eliminar el laboratorio ${lab.codigo} (${lab.nombre})? Esta acción borrará en cascada todos sus puestos, equipos y horarios asociados. NO se puede deshacer.`,
        textoConfirmar: 'Eliminar',
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.labService.delete(lab.id).subscribe({
          next: () => {
            this.notify.ok('Laboratorio eliminado correctamente');
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