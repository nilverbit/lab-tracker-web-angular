import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { MatriculaService } from '../core/services/matricula.service';
import { HorarioService } from '../core/services/horario.service';
import { NotifyService } from '../core/services/notify.service';
import {
  ColumnaPlantilla,
  Horario,
  ResultadoCargaMatricula,
} from '../core/models/modelos';

export interface CargaExcelDialogData {
  horarioId?: number | null;
}

@Component({
  selector: 'app-carga-excel-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-ok-bg text-ok flex items-center justify-center">
          <mat-icon>upload_file</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-ink leading-tight">Carga Masiva de Matrículas (.xlsx)</h2>
          <p class="text-xs text-muted">Importa estudiantes y matricúlalos en un turno de laboratorio</p>
        </div>
      </div>
      <button mat-icon-button type="button" (click)="cerrar()" aria-label="Cerrar">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="pt-5! pb-4!">
      <div class="w-full sm:w-[640px] space-y-4">
        <!-- 1. Horario destino -->
        <mat-form-field appearance="outline" class="w-full -mb-4">
          <mat-label>Horario / Turno destino</mat-label>
          <mat-select [(ngModel)]="horarioSeleccionado" [disabled]="subiendo()">
            @for (h of horarios(); track h.id) {
              <mat-option [value]="h.id">
                {{ h.nombre_turno }} — {{ h.fecha }} ({{ h.hora_inicio.slice(0, 5) }} - {{ h.hora_fin.slice(0, 5) }})
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- 2. Zona de archivo Excel -->
        <div
          class="border-2 border-dashed rounded-xl p-5 text-center transition-colors"
          [class.border-primary]="archivo()"
          [class.bg-primary/5]="archivo()"
          [class.border-slate-300]="!archivo()"
          [class.bg-slate-50]="!archivo()">
          <input
            #fileInput
            type="file"
            accept=".xlsx"
            class="hidden"
            (change)="alElegirArchivo($event)" />

          @if (archivo(); as f) {
            <div class="flex items-center justify-between gap-3 text-left">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-lg bg-ok-bg text-ok flex items-center justify-center shrink-0">
                  <mat-icon>description</mat-icon>
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-ink truncate">{{ f.name }}</p>
                  <p class="text-xs text-muted">{{ (f.size / 1024).toFixed(1) }} KB · Excel (.xlsx)</p>
                </div>
              </div>
              <button
                mat-button
                type="button"
                color="warn"
                [disabled]="subiendo()"
                (click)="quitarArchivo(fileInput)">
                Cambiar
              </button>
            </div>
          } @else {
            <mat-icon class="text-4xl! w-10! h-10! text-slate-400! mb-1">cloud_upload</mat-icon>
            <p class="text-sm font-medium text-ink">Selecciona tu archivo de matrícula (.xlsx)</p>
            <p class="text-xs text-muted mt-0.5 mb-3">
              Los alumnos que no existan se crearán automáticamente y los existentes se reutilizarán.
            </p>
            <button
              type="button"
              (click)="fileInput.click()"
              class="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:border-primary text-ink text-xs font-semibold shadow-xs cursor-pointer">
              Elegir archivo .xlsx
            </button>
          }
        </div>

        <!-- 3. Modo de carga -->
        <div class="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-ink">Permitir cargas parciales</p>
            <p class="text-xs text-muted mt-0.5">
              @if (permitirParciales) {
                Se insertarán las filas válidas y se reportarán aparte las filas con error.
              } @else {
                Modo estricto: si una sola fila tiene error, se cancela toda la importación.
              }
            </p>
          </div>
          <mat-slide-toggle
            [(ngModel)]="permitirParciales"
            [disabled]="subiendo()"
            color="primary" />
        </div>

        @if (subiendo()) {
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        }

        <!-- 4. Resultado de la carga -->
        @if (resultado(); as r) {
          <div
            class="rounded-xl border p-4 space-y-3"
            [class.bg-ok-bg/40]="r.filas_con_error === 0"
            [class.border-ok/30]="r.filas_con_error === 0"
            [class.bg-amber-50/70]="r.filas_con_error > 0"
            [class.border-warn/30]="r.filas_con_error > 0">
            <div class="flex items-start justify-between gap-2">
              <p class="text-sm font-semibold text-ink">{{ r.mensaje }}</p>
              <span class="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-white border border-slate-200 text-muted">
                {{ r.modo }}
              </span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div class="bg-white rounded-lg p-2.5 border border-slate-200/70">
                <span class="text-muted block">Filas leídas</span>
                <strong class="text-base text-ink">{{ r.total_filas_leidas }}</strong>
              </div>
              <div class="bg-white rounded-lg p-2.5 border border-slate-200/70">
                <span class="text-muted block">Insertadas</span>
                <strong class="text-base text-ok">{{ r.registros_insertados }}</strong>
              </div>
              <div class="bg-white rounded-lg p-2.5 border border-slate-200/70">
                <span class="text-muted block">Con error</span>
                <strong class="text-base" [class.text-danger]="r.filas_con_error > 0" [class.text-ink]="r.filas_con_error === 0">
                  {{ r.filas_con_error }}
                </strong>
              </div>
              <div class="bg-white rounded-lg p-2.5 border border-slate-200/70">
                <span class="text-muted block">Alumnos nuevos</span>
                <strong class="text-base text-primary">{{ r.alumnos_creados }}</strong>
              </div>
              <div class="bg-white rounded-lg p-2.5 border border-slate-200/70">
                <span class="text-muted block">Reutilizados</span>
                <strong class="text-base text-info">{{ r.alumnos_reutilizados }}</strong>
              </div>
              <div class="bg-white rounded-lg p-2.5 border border-slate-200/70">
                <span class="text-muted block">Filas válidas</span>
                <strong class="text-base text-ink">{{ r.filas_validas }}</strong>
              </div>
            </div>

            @if (r.errores.length > 0) {
              <div class="max-h-44 overflow-y-auto bg-white rounded-lg border border-red-200">
                <table class="w-full text-xs text-left">
                  <thead class="bg-red-50 text-danger sticky top-0">
                    <tr>
                      <th class="px-3 py-2 font-semibold">Fila</th>
                      <th class="px-3 py-2 font-semibold">Código</th>
                      <th class="px-3 py-2 font-semibold">Campo</th>
                      <th class="px-3 py-2 font-semibold">Error</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (e of r.errores; track $index) {
                      <tr>
                        <td class="px-3 py-1.5 font-mono font-semibold">{{ e.fila }}</td>
                        <td class="px-3 py-1.5 font-mono text-muted">{{ e.codigo || '—' }}</td>
                        <td class="px-3 py-1.5 font-medium text-ink">{{ e.campo }}</td>
                        <td class="px-3 py-1.5 text-danger">{{ e.mensaje }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }

        <!-- 5. Guía de columnas de la plantilla -->
        @if (columnasPlantilla().length > 0) {
          <details class="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <summary class="px-4 py-2.5 text-xs font-semibold text-ink cursor-pointer select-none bg-slate-50 hover:bg-slate-100 flex items-center justify-between">
              <span>Ver columnas esperadas en el archivo Excel ({{ columnasPlantilla().length }})</span>
              <span class="text-muted font-normal">Clic para desplegar</span>
            </summary>
            <div class="p-3 divide-y divide-slate-100 max-h-48 overflow-y-auto text-xs">
              @for (col of columnasPlantilla(); track col.nombre) {
                <div class="py-1.5 flex items-start justify-between gap-3">
                  <div>
                    <span class="font-mono font-bold text-ink">{{ col.nombre }}</span>
                    <p class="text-muted">{{ col.descripcion }}</p>
                  </div>
                  <span
                    class="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    [class.bg-red-50]="col.requerida"
                    [class.text-danger]="col.requerida"
                    [class.bg-slate-100]="!col.requerida"
                    [class.text-muted]="!col.requerida">
                    {{ col.requerida ? 'Obligatoria' : 'Opcional' }}
                  </span>
                </div>
              }
            </div>
          </details>
        }
      </div>
    </mat-dialog-content>

    <div class="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
      <button mat-button type="button" (click)="cerrar()" [disabled]="subiendo()">
        {{ huboCambios() ? 'Finalizar' : 'Cancelar' }}
      </button>
      <button
        type="button"
        (click)="subir()"
        [disabled]="!horarioSeleccionado || !archivo() || subiendo()"
        class="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
        <mat-icon class="text-lg! w-5! h-5!">publish</mat-icon>
        <span>{{ subiendo() ? 'Procesando Excel...' : 'Importar matrículas' }}</span>
      </button>
    </div>
  `,
})
export class CargaExcelDialog implements OnInit {
  private data = inject<CargaExcelDialogData | null>(MAT_DIALOG_DATA, { optional: true });
  private dialogRef = inject(MatDialogRef<CargaExcelDialog>);
  private matriculaService = inject(MatriculaService);
  private horarioService = inject(HorarioService);
  private notify = inject(NotifyService);

  horarios = signal<Horario[]>([]);
  columnasPlantilla = signal<ColumnaPlantilla[]>([]);
  archivo = signal<File | null>(null);
  resultado = signal<ResultadoCargaMatricula | null>(null);
  subiendo = signal(false);
  huboCambios = signal(false);

  horarioSeleccionado: number | null = this.data?.horarioId ?? null;
  permitirParciales = false;

  ngOnInit() {
    this.horarioService.getAll({ pagina: 1, tamano_pagina: 100 }).subscribe({
      next: (res) => {
        this.horarios.set(res.items);
        if (!this.horarioSeleccionado && res.items.length > 0) {
          this.horarioSeleccionado = res.items[0].id;
        }
      },
      error: () => {},
    });

    this.matriculaService.getPlantilla().subscribe({
      next: (cols) => this.columnasPlantilla.set(cols),
      error: () => {},
    });
  }

  alElegirArchivo(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file && !file.name.toLowerCase().endsWith('.xlsx')) {
      this.notify.aviso('Solo se permiten archivos en formato .xlsx');
      input.value = '';
      return;
    }
    this.archivo.set(file);
    this.resultado.set(null);
  }

  quitarArchivo(input: HTMLInputElement) {
    input.value = '';
    this.archivo.set(null);
    this.resultado.set(null);
  }

  subir() {
    const file = this.archivo();
    if (!this.horarioSeleccionado || !file || this.subiendo()) return;

    this.subiendo.set(true);
    this.resultado.set(null);

    this.matriculaService
      .cargarExcel(this.horarioSeleccionado, file, this.permitirParciales)
      .subscribe({
        next: (res) => {
          this.subiendo.set(false);
          this.resultado.set(res);
          if (res.registros_insertados > 0) {
            this.huboCambios.set(true);
            this.notify.ok(`Se registraron ${res.registros_insertados} matrícula(s).`);
          } else if (res.filas_con_error > 0) {
            this.notify.aviso('La carga encontró errores. Revisa el detalle por fila.');
          }
        },
        error: (err) => {
          this.subiendo.set(false);
          this.notify.error(err);
        },
      });
  }

  cerrar() {
    this.dialogRef.close(this.huboCambios());
  }
}