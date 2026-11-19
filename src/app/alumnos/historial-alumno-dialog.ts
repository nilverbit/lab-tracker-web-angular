import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { HorarioService } from '../core/services/horario.service';
import { NotifyService } from '../core/services/notify.service';
import { Alumno, Asignacion } from '../core/models/modelos';

@Component({
  selector: 'app-historial-alumno-dialog',
  imports: [
    DatePipe,
    MatDialogModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-blue-50 text-info flex items-center justify-center">
          <mat-icon>history</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-ink leading-tight">Historial de Responsabilidad</h2>
          <p class="text-xs text-muted">
            {{ alumno.apellidos }}, {{ alumno.nombres }} ·
            <span class="font-mono font-semibold text-ink">{{ alumno.codigo }}</span>
          </p>
        </div>
      </div>
      <button mat-icon-button mat-dialog-close type="button" aria-label="Cerrar">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="pt-4! pb-2!">
      <div class="w-full sm:w-[560px]">
        @if (cargando()) {
          <mat-progress-bar mode="indeterminate" class="mb-3"></mat-progress-bar>
        }

        @if (registros().length === 0 && !cargando()) {
          <div class="text-center py-10 border border-dashed border-slate-200 rounded-xl text-muted">
            <mat-icon class="text-4xl! w-10! h-10! text-slate-300! mb-1">desktop_windows</mat-icon>
            <p class="text-sm font-medium text-ink">Sin asignaciones registradas</p>
            <p class="text-xs mt-0.5">
              Este alumno aún no tiene uso de workstations registrado en turnos.
            </p>
          </div>
        } @else {
          <div class="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            @for (item of registros(); track item.id) {
              <div class="px-4 py-3 bg-white flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                      Puesto #{{ item.workstation_id }}
                    </span>
                    <span class="text-xs font-medium text-muted">
                      Turno #{{ item.horario_id }}
                    </span>
                  </div>
                  @if (item.observaciones) {
                    <p class="text-xs text-ink mt-1.5">{{ item.observaciones }}</p>
                  } @else {
                    <p class="text-xs text-slate-400 mt-1">Sin observaciones</p>
                  }
                </div>
                <span class="text-xs text-muted whitespace-nowrap">
                  {{ item.fecha_asignacion | date: 'dd/MM/yyyy HH:mm' }}
                </span>
              </div>
            }
          </div>

          <mat-paginator
            [length]="total()"
            [pageIndex]="pagina() - 1"
            [pageSize]="tamanoPagina()"
            [pageSizeOptions]="[5, 10, 20]"
            (page)="alPaginar($event)"
            class="mt-2" />
        }
      </div>
    </mat-dialog-content>

    <div class="flex justify-end px-6 py-3 border-t border-slate-100 bg-slate-50/60">
      <button mat-button type="button" mat-dialog-close>Cerrar</button>
    </div>
  `,
})
export class HistorialAlumnoDialog implements OnInit {
  alumno = inject<Alumno>(MAT_DIALOG_DATA);
  private horarioService = inject(HorarioService);
  private notify = inject(NotifyService);

  registros = signal<Asignacion[]>([]);
  total = signal(0);
  pagina = signal(1);
  tamanoPagina = signal(10);
  cargando = signal(false);

  ngOnInit() {
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
      .getHistorialAlumno(this.alumno.codigo, {
        pagina: this.pagina(),
        tamano_pagina: this.tamanoPagina(),
      })
      .subscribe({
        next: (res) => {
          this.registros.set(res.items);
          this.total.set(res.total);
          this.cargando.set(false);
        },
        error: (err) => {
          this.cargando.set(false);
          this.notify.error(err);
        },
      });
  }
}