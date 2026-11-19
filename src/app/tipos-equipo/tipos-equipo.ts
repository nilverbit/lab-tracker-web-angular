import { Component, OnInit, inject, signal } from '@angular/core';
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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TipoEquipoService } from '../core/services/tipo-equipo.service';
import { NotifyService } from '../core/services/notify.service';
import { ConfirmService } from '../shared/confirm-dialog';
import { StatusChip } from '../shared/status-chip';
import { PageHeader } from '../shared/page-header';
import { TipoEquipoDialog } from './tipo-equipo-dialog';
import {
  CATEGORIAS_TIPO_EQUIPO,
  CategoriaTipoEquipo,
  TipoEquipoCatalogo,
} from '../core/models/modelos';

@Component({
  selector: 'app-tipos-equipo',
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
    MatSlideToggleModule,
    MatTooltipModule,
    StatusChip,
    PageHeader,
  ],
  template: `
    <app-page-header
      titulo="Catálogo de Tipos de Equipo"
      subtitulo="Perfiles técnicos estándar, vida útil y requisitos de licenciamiento">
      <button
        type="button"
        (click)="abrirDialogo()"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer">
        <mat-icon class="text-xl! w-5! h-5!">add</mat-icon>
        <span>Nuevo Tipo</span>
      </button>
    </app-page-header>

    <div class="space-y-4">
      <!-- Barra de filtros -->
      <div class="bg-white px-5 py-4 rounded-xl shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-4">
          <mat-form-field appearance="outline" class="w-56 -mb-5">
            <mat-label>Categoría</mat-label>
            <mat-select [(ngModel)]="categoriaSeleccionada" (selectionChange)="alCambiarFiltro()">
              <mat-option [value]="null">Todas las categorías</mat-option>
              @for (cat of categorias; track cat) {
                <mat-option [value]="cat" class="capitalize">{{ cat }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-slide-toggle
            [(ngModel)]="soloActivos"
            (change)="alCambiarFiltro()"
            color="primary">
            <span class="text-sm font-medium text-ink">Solo activos</span>
          </mat-slide-toggle>

          @if (categoriaSeleccionada || soloActivos) {
            <button mat-button type="button" (click)="limpiarFiltros()" class="text-muted!">
              Limpiar
            </button>
          }
        </div>

        <div class="flex items-center gap-3">
          <span class="text-xs font-medium text-muted bg-slate-100 px-3 py-1.5 rounded-full">
            {{ total() }} {{ total() === 1 ? 'tipo' : 'tipos' }}
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
            <ng-container matColumnDef="codigo">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Código</th>
              <td mat-cell *matCellDef="let el">
                <span class="font-bold font-mono text-sm text-ink">{{ el.codigo }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="nombre">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Tipo / Especificaciones</th>
              <td mat-cell *matCellDef="let el" class="py-3!">
                <div class="font-semibold text-ink">{{ el.nombre }}</div>
                <div class="text-xs text-muted truncate max-w-md" [matTooltip]="el.descripcion">
                  {{ el.descripcion }}
                </div>
                @if (el.especificaciones_minimas) {
                  <div class="text-[11px] text-primary mt-0.5 truncate max-w-md">
                    Mín: {{ el.especificaciones_minimas }}
                  </div>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="categoria">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Categoría</th>
              <td mat-cell *matCellDef="let el">
                <span class="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-ink text-xs font-medium capitalize">
                  {{ el.categoria }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="requisitos">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Requisitos</th>
              <td mat-cell *matCellDef="let el">
                <div class="flex flex-wrap gap-1.5">
                  @if (el.requiere_mantenimiento) {
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-warn border border-warn/20">
                      <mat-icon class="text-xs! w-3.5! h-3.5!">build</mat-icon> Mantenimiento
                    </span>
                  }
                  @if (el.requiere_licencia) {
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-info border border-info/20">
                      <mat-icon class="text-xs! w-3.5! h-3.5!">vpn_key</mat-icon> Licencia
                    </span>
                  }
                  @if (!el.requiere_mantenimiento && !el.requiere_licencia) {
                    <span class="text-xs text-slate-400">Estándar</span>
                  }
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="referencia">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Vida Útil / Ref.</th>
              <td mat-cell *matCellDef="let el" class="text-xs">
                <div class="text-ink font-medium">
                  {{ el.vida_util_meses ? el.vida_util_meses + ' meses' : '—' }}
                </div>
                @if (el.costo_referencial != null) {
                  <div class="text-muted">
                    {{ el.moneda.toUpperCase() }} {{ el.costo_referencial | number: '1.2-2' }}
                  </div>
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
                <button mat-icon-button matTooltip="Editar tipo" (click)="abrirDialogo(el)">
                  <mat-icon class="text-primary!">edit</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Eliminar tipo" (click)="eliminar(el)">
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
                    <mat-icon class="text-4xl! w-10! h-10! text-slate-300!">category</mat-icon>
                    <p class="text-sm font-medium text-ink">No hay tipos de equipo registrados</p>
                    <p class="text-xs">Crea el catálogo para estandarizar el inventario.</p>
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
export class TiposEquipo implements OnInit {
  private tipoService = inject(TipoEquipoService);
  private dialog = inject(MatDialog);
  private notify = inject(NotifyService);
  private confirm = inject(ConfirmService);

  datos = signal<TipoEquipoCatalogo[]>([]);
  total = signal(0);
  pagina = signal(1);
  tamanoPagina = signal(10);
  cargando = signal(false);

  categorias = CATEGORIAS_TIPO_EQUIPO;
  categoriaSeleccionada: CategoriaTipoEquipo | null = null;
  soloActivos = false;

  columnas = ['codigo', 'nombre', 'categoria', 'requisitos', 'referencia', 'estado', 'acciones'];

  ngOnInit() {
    this.cargar();
  }

  alCambiarFiltro() {
    this.pagina.set(1);
    this.cargar();
  }

  limpiarFiltros() {
    this.categoriaSeleccionada = null;
    this.soloActivos = false;
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
    this.tipoService
      .getAll({
        solo_activos: this.soloActivos,
        categoria: this.categoriaSeleccionada,
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

  abrirDialogo(tipo?: TipoEquipoCatalogo) {
    const ref = this.dialog.open(TipoEquipoDialog, {
      data: tipo ?? null,
      disableClose: true,
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((cambio) => {
      if (cambio) this.cargar();
    });
  }

  eliminar(tipo: TipoEquipoCatalogo) {
    this.confirm
      .pedir({
        titulo: 'Eliminar Tipo de Equipo',
        mensaje: `¿Estás seguro de eliminar "${tipo.nombre}" (${tipo.codigo}) del catálogo?`,
        textoConfirmar: 'Eliminar',
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.tipoService.delete(tipo.id).subscribe({
          next: () => {
            this.notify.ok('Tipo de equipo eliminado correctamente');
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