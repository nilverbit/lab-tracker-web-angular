import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
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

import { EquipoService } from '../core/services/equipo.service';
import { LaboratorioService } from '../core/services/laboratorio.service';
import { NotifyService } from '../core/services/notify.service';
import { ConfirmService } from '../shared/confirm-dialog';
import { StatusChip } from '../shared/status-chip';
import { PageHeader } from '../shared/page-header';
import { EquipoDialog } from './equipo-dialog';
import {
  CATEGORIAS_TIPO_EQUIPO,
  CategoriaTipoEquipo,
  Equipo,
  Laboratorio,
} from '../core/models/modelos';

@Component({
  selector: 'app-equipos',
  imports: [
    DecimalPipe,
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
      titulo="Inventario de Equipos"
      subtitulo="Control patrimonial, ubicación y estado técnico de activos">
      <button
        type="button"
        (click)="abrirDialogo()"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer">
        <mat-icon class="text-xl! w-5! h-5!">add</mat-icon>
        <span>Nuevo Equipo</span>
      </button>
    </app-page-header>

    <div class="space-y-4">
      <!-- Filtros -->
      <div class="bg-white px-5 py-4 rounded-xl shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3">
          <mat-form-field appearance="outline" class="w-64 -mb-5">
            <mat-label>Laboratorio</mat-label>
            <mat-select [(ngModel)]="labSeleccionado" (selectionChange)="alCambiarFiltro()">
              <mat-option [value]="null">Todos los laboratorios</mat-option>
              @for (lab of laboratorios(); track lab.id) {
                <mat-option [value]="lab.id">{{ lab.codigo }} — {{ lab.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-52 -mb-5">
            <mat-label>Categoría</mat-label>
            <mat-select
              [(ngModel)]="categoriaSeleccionada"
              (selectionChange)="alCambiarFiltro()"
              [disabled]="!labSeleccionado"
              matTooltip="Selecciona un laboratorio para filtrar por categoría en servidor">
              <mat-option [value]="null">Todas las categorías</mat-option>
              @for (cat of categorias; track cat) {
                <mat-option [value]="cat" class="capitalize">{{ cat }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          @if (labSeleccionado || categoriaSeleccionada) {
            <button mat-button type="button" (click)="limpiarFiltros()" class="text-muted!">
              Limpiar
            </button>
          }
        </div>

        <div class="flex items-center gap-3">
          <span class="text-xs font-medium text-muted bg-slate-100 px-3 py-1.5 rounded-full">
            {{ total() }} {{ total() === 1 ? 'equipo' : 'equipos' }}
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
            <ng-container matColumnDef="patrimonial">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Cód. Patrimonial</th>
              <td mat-cell *matCellDef="let el">
                <div class="font-bold font-mono text-sm text-ink">{{ el.codigo_patrimonial }}</div>
                @if (el.numero_serie) {
                  <div class="text-xs text-muted">S/N: {{ el.numero_serie }}</div>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="categoria">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Categoría</th>
              <td mat-cell *matCellDef="let el">
                <span class="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-ink text-xs font-medium capitalize">
                  {{ el.categoria || 'otro' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="marca_modelo">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Equipo</th>
              <td mat-cell *matCellDef="let el">
                <div class="font-medium text-ink">{{ el.marca }} {{ el.modelo }}</div>
                <div class="text-xs text-muted truncate max-w-xs" [matTooltip]="el.caracteristicas">
                  {{ el.caracteristicas }}
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="ubicacion">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Ubicación</th>
              <td mat-cell *matCellDef="let el" class="text-sm">
                <div class="font-medium text-ink">{{ nombreLab(el.laboratorio_id) }}</div>
                <div class="text-xs text-muted">
                  {{ el.workstation_id ? 'Puesto #' + el.workstation_id : 'Almacén / sin puesto' }}
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="valor">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Valor</th>
              <td mat-cell *matCellDef="let el" class="text-sm text-ink">
                @if (el.costo_adquisicion != null) {
                  {{ (el.moneda || 'pen').toUpperCase() }} {{ el.costo_adquisicion | number: '1.2-2' }}
                } @else if (el.costo_estimado != null) {
                  <span class="text-muted">
                    ~{{ (el.moneda || 'pen').toUpperCase() }} {{ el.costo_estimado | number: '1.2-2' }}
                  </span>
                } @else {
                  <span class="text-slate-400">—</span>
                }
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
                <button mat-icon-button matTooltip="Editar equipo" (click)="abrirDialogo(el)">
                  <mat-icon class="text-primary!">edit</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Eliminar equipo" (click)="eliminar(el)">
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
                    <mat-icon class="text-4xl! w-10! h-10! text-slate-300!">computer</mat-icon>
                    <p class="text-sm font-medium text-ink">No se encontraron equipos</p>
                    <p class="text-xs">Prueba cambiando los filtros o registra un equipo nuevo.</p>
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
export class Equipos implements OnInit {
  private equipoService = inject(EquipoService);
  private labService = inject(LaboratorioService);
  private dialog = inject(MatDialog);
  private notify = inject(NotifyService);
  private confirm = inject(ConfirmService);

  datos = signal<Equipo[]>([]);
  laboratorios = signal<Laboratorio[]>([]);
  total = signal(0);
  pagina = signal(1);
  tamanoPagina = signal(10);
  cargando = signal(false);

  categorias = CATEGORIAS_TIPO_EQUIPO;
  labSeleccionado: number | null = null;
  categoriaSeleccionada: CategoriaTipoEquipo | null = null;

  columnas = ['patrimonial', 'categoria', 'marca_modelo', 'ubicacion', 'valor', 'estado', 'acciones'];

  private mapaLabs = computed(() => {
    const mapa = new Map<number, string>();
    for (const l of this.laboratorios()) mapa.set(l.id, l.codigo);
    return mapa;
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
    if (!this.labSeleccionado) {
      this.categoriaSeleccionada = null;
    }
    this.pagina.set(1);
    this.cargar();
  }

  limpiarFiltros() {
    this.labSeleccionado = null;
    this.categoriaSeleccionada = null;
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
    const pag = { pagina: this.pagina(), tamano_pagina: this.tamanoPagina() };

    const peticion = this.labSeleccionado
      ? this.equipoService.getByLaboratorio(this.labSeleccionado, {
          ...pag,
          categoria: this.categoriaSeleccionada,
        })
      : this.equipoService.getAll(pag);

    peticion.subscribe({
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

  abrirDialogo(equipo?: Equipo) {
    const ref = this.dialog.open(EquipoDialog, {
      data: equipo ?? null,
      disableClose: true,
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((cambio) => {
      if (cambio) this.cargar();
    });
  }

  eliminar(equipo: Equipo) {
    this.confirm
      .pedir({
        titulo: 'Eliminar Equipo',
        mensaje: `¿Estás seguro de eliminar el equipo ${equipo.codigo_patrimonial}? Esta acción no se puede deshacer.`,
        textoConfirmar: 'Eliminar',
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.equipoService.delete(equipo.id).subscribe({
          next: () => {
            this.notify.ok('Equipo eliminado correctamente');
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