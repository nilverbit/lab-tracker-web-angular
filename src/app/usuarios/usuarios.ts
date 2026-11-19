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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

import { UsuarioService } from '../core/services/usuario.service';
import { RolService } from '../core/services/rol.service';
import { AuthService } from '../core/services/auth.service';
import { NotifyService } from '../core/services/notify.service';
import { ConfirmService } from '../shared/confirm-dialog';
import { StatusChip } from '../shared/status-chip';
import { PageHeader } from '../shared/page-header';
import { UsuarioDialog } from './usuario-dialog';
import { Rol, Usuario } from '../core/models/modelos';

@Component({
  selector: 'app-usuarios',
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
    MatSlideToggleModule,
    MatTooltipModule,
    StatusChip,
    PageHeader,
  ],
  template: `
    <app-page-header
      titulo="Usuarios del Sistema"
      subtitulo="Administración de cuentas, credenciales y roles asignados">
      <button
        type="button"
        (click)="abrirDialogo()"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer">
        <mat-icon class="text-xl! w-5! h-5!">person_add</mat-icon>
        <span>Nuevo Usuario</span>
      </button>
    </app-page-header>

    <div class="space-y-4">
      <div class="bg-white px-5 py-4 rounded-xl shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3 flex-1">
          <mat-form-field appearance="outline" class="w-full sm:w-64 -mb-5">
            <mat-label>Buscar usuario, nombre o correo</mat-label>
            <mat-icon matPrefix class="mr-1.5 text-muted!">search</mat-icon>
            <input
              matInput
              [(ngModel)]="busqueda"
              (keyup.enter)="alCambiarFiltro()"
              placeholder="Presiona Enter para buscar" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-52 -mb-5">
            <mat-label>Filtrar por rol</mat-label>
            <mat-select [(ngModel)]="rolFiltro" (selectionChange)="alCambiarFiltro()">
              <mat-option [value]="null">Todos los roles</mat-option>
              @for (r of roles(); track r.id) {
                <mat-option [value]="r.id" class="capitalize">{{ r.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-slide-toggle
            [(ngModel)]="soloActivos"
            (change)="alCambiarFiltro()"
            color="primary">
            <span class="text-sm font-medium text-ink">Solo activos</span>
          </mat-slide-toggle>

          <button
            type="button"
            (click)="alCambiarFiltro()"
            class="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-ink text-xs font-semibold cursor-pointer">
            Buscar
          </button>

          @if (busqueda || rolFiltro || soloActivos) {
            <button mat-button type="button" (click)="limpiarFiltros()" class="text-muted!">
              Limpiar
            </button>
          }
        </div>

        <div class="flex items-center gap-3">
          <span class="text-xs font-medium text-muted bg-slate-100 px-3 py-1.5 rounded-full">
            {{ total() }} {{ total() === 1 ? 'usuario' : 'usuarios' }}
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

      <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        @if (cargando()) {
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        }

        <div class="overflow-x-auto">
          <table mat-table [dataSource]="datos()" class="w-full min-w-[840px]">
            <ng-container matColumnDef="usuario">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Usuario</th>
              <td mat-cell *matCellDef="let el" class="py-3!">
                <div class="flex items-center gap-3">
                  @if (el.url_imagen) {
                    <img
                      [src]="el.url_imagen"
                      [alt]="el.username"
                      class="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" />
                  } @else {
                    <div class="w-9 h-9 rounded-full bg-primary/15 text-primary font-bold text-sm flex items-center justify-center shrink-0 uppercase">
                      {{ el.nombres.charAt(0) }}
                    </div>
                  }
                  <div>
                    <div class="font-semibold text-ink flex items-center gap-1.5">
                      <span>{{ el.nombres }} {{ el.apellidos }}</span>
                      @if (esUsuarioActual(el)) {
                        <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          Tú
                        </span>
                      }
                    </div>
                    <div class="text-xs text-muted font-mono">&#64;{{ el.username }}</div>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="correo">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Correo</th>
              <td mat-cell *matCellDef="let el" class="text-sm text-muted">
                {{ el.correo || '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="rol">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Rol</th>
              <td mat-cell *matCellDef="let el">
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-ink text-xs font-semibold capitalize">
                  <mat-icon class="text-sm! w-3.5! h-3.5! text-primary!">shield</mat-icon>
                  {{ nombreRol(el.rol_id) }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="creado_en">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Registro</th>
              <td mat-cell *matCellDef="let el" class="text-xs text-muted">
                {{ el.creado_en | date: 'dd/MM/yyyy' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef class="font-semibold!">Estado</th>
              <td mat-cell *matCellDef="let el">
                <app-status-chip [valor]="el.activo ? 'activo' : 'inactivo'" />
              </td>
            </ng-container>

            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef class="text-right! font-semibold!">Acciones</th>
              <td mat-cell *matCellDef="let el" class="text-right!">
                <button mat-icon-button matTooltip="Editar usuario" (click)="abrirDialogo(el)">
                  <mat-icon class="text-primary!">edit</mat-icon>
                </button>
                <button
                  mat-icon-button
                  [disabled]="esUsuarioActual(el)"
                  [matTooltip]="esUsuarioActual(el) ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'"
                  (click)="eliminar(el)">
                  <mat-icon [class.text-danger!]="!esUsuarioActual(el)" [class.text-slate-300!]="esUsuarioActual(el)">
                    delete
                  </mat-icon>
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
                    <mat-icon class="text-4xl! w-10! h-10! text-slate-300!">manage_accounts</mat-icon>
                    <p class="text-sm font-medium text-ink">No se encontraron usuarios</p>
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
export class Usuarios implements OnInit {
  private usuarioService = inject(UsuarioService);
  private rolService = inject(RolService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private notify = inject(NotifyService);
  private confirm = inject(ConfirmService);

  datos = signal<Usuario[]>([]);
  roles = signal<Rol[]>([]);
  total = signal(0);
  pagina = signal(1);
  tamanoPagina = signal(10);
  cargando = signal(false);

  busqueda = '';
  rolFiltro: number | null = null;
  soloActivos = false;

  columnas = ['usuario', 'correo', 'rol', 'creado_en', 'estado', 'acciones'];

  private mapaRoles = computed(() => {
    const m = new Map<number, string>();
    for (const r of this.roles()) m.set(r.id, r.nombre);
    return m;
  });

  ngOnInit() {
    this.rolService.getListadoCompleto(false).subscribe({
      next: (r) => this.roles.set(r),
      error: () => {},
    });
    this.cargar();
  }

  nombreRol(rolId: number): string {
    return this.mapaRoles().get(rolId) ?? `Rol #${rolId}`;
  }

  esUsuarioActual(u: Usuario): boolean {
    const actual = this.auth.usuario();
    return actual ? actual.id === u.id : u.username === this.auth.username();
  }

  alCambiarFiltro() {
    this.pagina.set(1);
    this.cargar();
  }

  limpiarFiltros() {
    this.busqueda = '';
    this.rolFiltro = null;
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
    this.usuarioService
      .getAll({
        busqueda: this.busqueda,
        rol_id: this.rolFiltro,
        solo_activos: this.soloActivos,
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

  abrirDialogo(usuario?: Usuario) {
    const ref = this.dialog.open(UsuarioDialog, {
      data: usuario ?? null,
      disableClose: true,
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((cambio) => {
      if (cambio) this.cargar();
    });
  }

  eliminar(usuario: Usuario) {
    if (this.esUsuarioActual(usuario)) return;
    this.confirm
      .pedir({
        titulo: 'Eliminar Usuario',
        mensaje: `¿Estás seguro de eliminar la cuenta @${usuario.username} (${usuario.nombres} ${usuario.apellidos})?`,
        textoConfirmar: 'Eliminar',
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.usuarioService.delete(usuario.id).subscribe({
          next: () => {
            this.notify.ok('Usuario eliminado correctamente');
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