import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LicenciaService } from '../core/services/licencia.service';
import { EquipoService } from '../core/services/equipo.service';
import { NotifyService } from '../core/services/notify.service';
import { ConfirmService } from '../shared/confirm-dialog';
import { StatusChip } from '../shared/status-chip';
import { PageHeader } from '../shared/page-header';
import { LicenciaDialog } from './licencia-dialog';
import {
  ESTADOS_LICENCIA,
  Equipo,
  EstadoLicencia,
  Licencia,
} from '../core/models/modelos';

@Component({
  selector: 'app-licencias',
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
      titulo="Licencias de Software"
      subtitulo="Inventario de claves, puestos autorizados y fechas de vencimiento">
      <button
        type="button"
        (click)="abrirDialogo()"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer">
        <mat-icon class="text-xl! w-5! h-5!">add</mat-icon>
        <span>Nueva Licencia</span>
      </button>
    </app-page-header>

    <div class="space-y-4">
      <!-- Barra de filtros -->
      <div class="bg-white px-5 py-4 rounded-xl shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3">
          <mat-form-field appearance="outline" class="w-48 -mb-5">
            <mat-label>Estado</mat-label>
            <mat-select [(ngModel)]="estadoSeleccionado" (selectionChange)="alCambiarFiltro()">
              <mat-option [value]="null">Todos</mat-option>
              @for (est of estados; track est) {
                <mat-option [value]="est" class="capitalize">{{ est }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-64 -mb-5">
            <mat-label>Equipo asignado</mat-label>
            <mat-select [(ngModel)]="equipoSeleccionado" (selectionChange)="alCambiarFiltro()">
              <mat-option [value]="null">Todos los equipos</mat-option>
              @for (eq of equipos(); track eq.id) {
                <mat-option [value]="eq.id">{{ eq.codigo_patrimonial }} — {{ eq.marca }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          @if (estadoSeleccionado || equipoSeleccionado) {
            <button mat-button type="button" (click)="limpiarFiltros()" class="text-muted!">
              Limpiar
            </button>
          }
        </div>

        <div class="flex items-center gap-3">
          <span class="text-xs font-medium text-muted bg-slate-100 px-3 py-1.5 rounded-full">
            {{ total() }} {{ total() === 1 ? 'licencia' : 'licencias' }}
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
          <table mat-table [dataSource]="datos()" class="w-full min-w-[920px]">
            <ng-container matColumnDef="software">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Software / Código</th>
              <td mat-cell *matCellDef="let el" class="py-3!">
                <div class="font-semibold text-ink">{{ el.nombre }}</div>
                <div class="text-xs text-muted flex items-center gap-2 mt-0.5">
                  <span class="font-mono font-semibold text-primary">{{ el.codigo }}</span>
                  @if (el.fabricante) {
                    <span>· {{ el.fabricante }}</span>
                  }
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="tipo">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Tipo / Puestos</th>
              <td mat-cell *matCellDef="let el" class="text-xs">
                <span class="inline-block px-2 py-0.5 rounded bg-slate-100 text-ink font-medium capitalize">
                  {{ el.tipo }}
                </span>
                <div class="text-muted mt-1">
                  {{ el.cantidad_usuarios }} {{ el.cantidad_usuarios === 1 ? 'usuario' : 'usuarios' }}
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="clave">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Clave de Producto</th>
              <td mat-cell *matCellDef="let el">
                @if (el.clave_producto) {
                  <div class="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                    <span class="font-mono text-xs text-ink">
                      {{ esClaveVisible(el.id) ? el.clave_producto : enmascarar(el.clave_producto) }}
                    </span>
                    <button
                      type="button"
                      (click)="alternarClave(el.id)"
                      class="p-0.5 text-muted hover:text-ink cursor-pointer"
                      [matTooltip]="esClaveVisible(el.id) ? 'Ocultar' : 'Mostrar clave'">
                      <mat-icon class="text-base! w-4! h-4!">
                        {{ esClaveVisible(el.id) ? 'visibility_off' : 'visibility' }}
                      </mat-icon>
                    </button>
                    <button
                      type="button"
                      (click)="copiarClave(el.clave_producto)"
                      class="p-0.5 text-muted hover:text-primary cursor-pointer"
                      matTooltip="Copiar clave">
                      <mat-icon class="text-base! w-4! h-4!">content_copy</mat-icon>
                    </button>
                  </div>
                } @else {
                  <span class="text-xs text-slate-400">Sin serial</span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="asignacion">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Asignación</th>
              <td mat-cell *matCellDef="let el" class="text-xs">
                @if (el.equipo_id) {
                  <span class="font-mono font-semibold text-ink">{{ codigoEquipo(el.equipo_id) }}</span>
                } @else {
                  <span class="text-muted">Institucional / General</span>
                }
                @if (el.costo != null) {
                  <div class="text-muted mt-0.5">
                    {{ el.moneda.toUpperCase() }} {{ el.costo | number: '1.2-2' }}
                  </div>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="vencimiento">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Vencimiento</th>
              <td mat-cell *matCellDef="let el" class="text-xs">
                @if (el.fecha_vencimiento) {
                  <div
                    class="font-medium"
                    [class.text-danger]="estaVencida(el.fecha_vencimiento)"
                    [class.text-warn]="porVencer(el.fecha_vencimiento)"
                    [class.text-ink]="!estaVencida(el.fecha_vencimiento) && !porVencer(el.fecha_vencimiento)">
                    {{ el.fecha_vencimiento }}
                  </div>
                  @if (estaVencida(el.fecha_vencimiento)) {
                    <span class="text-[11px] text-danger font-semibold">Expirada</span>
                  } @else if (porVencer(el.fecha_vencimiento)) {
                    <span class="text-[11px] text-warn font-semibold">Por vencer (&lt;30d)</span>
                  }
                } @else {
                  <span class="text-muted">Perpetua / Sin fecha</span>
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
                <button mat-icon-button matTooltip="Editar licencia" (click)="abrirDialogo(el)">
                  <mat-icon class="text-primary!">edit</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Eliminar licencia" (click)="eliminar(el)">
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
                    <mat-icon class="text-4xl! w-10! h-10! text-slate-300!">vpn_key</mat-icon>
                    <p class="text-sm font-medium text-ink">No hay licencias registradas</p>
                    <p class="text-xs">Registra las suscripciones y claves de software de los laboratorios.</p>
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
export class Licencias implements OnInit {
  private licenciaService = inject(LicenciaService);
  private equipoService = inject(EquipoService);
  private clipboard = inject(Clipboard);
  private dialog = inject(MatDialog);
  private notify = inject(NotifyService);
  private confirm = inject(ConfirmService);

  datos = signal<Licencia[]>([]);
  equipos = signal<Equipo[]>([]);
  total = signal(0);
  pagina = signal(1);
  tamanoPagina = signal(10);
  cargando = signal(false);
  clavesVisibles = signal<Set<number>>(new Set());

  estados = ESTADOS_LICENCIA;
  estadoSeleccionado: EstadoLicencia | null = null;
  equipoSeleccionado: number | null = null;

  columnas = ['software', 'tipo', 'clave', 'asignacion', 'vencimiento', 'estado', 'acciones'];

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

  esClaveVisible(id: number): boolean {
    return this.clavesVisibles().has(id);
  }

  alternarClave(id: number) {
    const nuevo = new Set(this.clavesVisibles());
    if (nuevo.has(id)) nuevo.delete(id);
    else nuevo.add(id);
    this.clavesVisibles.set(nuevo);
  }

  enmascarar(clave: string): string {
    if (clave.length <= 4) return '••••';
    return '••••-••••-' + clave.slice(-4);
  }

  copiarClave(clave: string) {
    this.clipboard.copy(clave);
    this.notify.ok('Clave de producto copiada al portapapeles');
  }

  estaVencida(fechaStr: string): boolean {
    const hoy = new Date().toISOString().slice(0, 10);
    return fechaStr < hoy;
  }

  porVencer(fechaStr: string): boolean {
    if (this.estaVencida(fechaStr)) return false;
    const hoy = new Date();
    const vence = new Date(fechaStr + 'T00:00:00');
    const dias = (vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
    return dias <= 30;
  }

  alCambiarFiltro() {
    this.pagina.set(1);
    this.cargar();
  }

  limpiarFiltros() {
    this.estadoSeleccionado = null;
    this.equipoSeleccionado = null;
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
    this.licenciaService
      .getAll({
        estado: this.estadoSeleccionado,
        equipo_id: this.equipoSeleccionado,
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

  abrirDialogo(licencia?: Licencia) {
    const ref = this.dialog.open(LicenciaDialog, {
      data: licencia ?? null,
      disableClose: true,
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((cambio) => {
      if (cambio) this.cargar();
    });
  }

  eliminar(licencia: Licencia) {
    this.confirm
      .pedir({
        titulo: 'Eliminar Licencia',
        mensaje: `¿Estás seguro de eliminar la licencia "${licencia.nombre}" (${licencia.codigo})?`,
        textoConfirmar: 'Eliminar',
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.licenciaService.delete(licencia.id).subscribe({
          next: () => {
            this.notify.ok('Licencia eliminada correctamente');
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