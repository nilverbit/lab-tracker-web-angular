import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { HorarioService } from '../core/services/horario.service';
import { WorkstationService } from '../core/services/workstation.service';
import { NotifyService } from '../core/services/notify.service';
import { StatusChip } from '../shared/status-chip';
import { Asignacion, Horario, Workstation } from '../core/models/modelos';

@Component({
  selector: 'app-asignaciones-dialog',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressBarModule,
    StatusChip,
  ],
  template: `
    <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <mat-icon>assignment_ind</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-ink leading-tight">Asignación de Puestos</h2>
          <p class="text-xs text-muted">
            {{ horario.nombre_turno }} · {{ horario.fecha }} ({{ horario.hora_inicio.slice(0, 5) }} - {{ horario.hora_fin.slice(0, 5) }})
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <app-status-chip [valor]="horario.estado" />
        <button mat-icon-button mat-dialog-close type="button" aria-label="Cerrar">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>

    <mat-dialog-content class="pt-4! pb-4!">
      <div class="w-full sm:w-[600px] space-y-5">
        @if (puedeAsignar()) {
          <form
            [formGroup]="form"
            (ngSubmit)="asignar()"
            class="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
            <p class="text-xs font-semibold uppercase tracking-wider text-muted">
              Registrar nueva asignación
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <mat-form-field appearance="outline" class="-mb-4">
                <mat-label>Puesto / Workstation</mat-label>
                <mat-select formControlName="workstation_id">
                  @for (w of puestos(); track w.id) {
                    <mat-option [value]="w.id" [disabled]="w.estado !== 'disponible'">
                      {{ w.codigo }} — {{ w.ubicacion_interna }} ({{ w.estado }})
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="-mb-4">
                <mat-label>Código de alumno</mat-label>
                <input matInput formControlName="codigo_alumno" placeholder="Ej. 27250102" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="sm:col-span-2 -mb-4">
                <mat-label>Observaciones (opcional)</mat-label>
                <input matInput formControlName="observaciones" placeholder="Ej. Recibe teclado y mouse conformes" />
              </mat-form-field>
            </div>

            <div class="flex justify-end pt-1">
              <button
                type="submit"
                [disabled]="form.invalid || guardando()"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50">
                <mat-icon class="text-base! w-4! h-4!">person_add</mat-icon>
                <span>{{ guardando() ? 'Asignando...' : 'Asignar puesto' }}</span>
              </button>
            </div>
          </form>
        }

        <div>
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs font-semibold uppercase tracking-wider text-muted">
              Puestos asignados en este turno ({{ asignaciones().length }})
            </p>
          </div>

          @if (cargando()) {
            <mat-progress-bar mode="indeterminate" class="mb-2"></mat-progress-bar>
          }

          @if (asignaciones().length === 0 && !cargando()) {
            <div class="text-center py-8 border border-dashed border-slate-200 rounded-xl text-muted text-sm">
              Aún no hay alumnos asignados a puestos en este turno.
            </div>
          } @else {
            <div class="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              @for (a of asignaciones(); track a.id) {
                <div class="px-4 py-3 flex items-center justify-between gap-3 bg-white">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-mono font-bold text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                        {{ codigoPuesto(a.workstation_id) }}
                      </span>
                      <span class="font-semibold text-sm text-ink">{{ a.codigo_alumno }}</span>
                    </div>
                    @if (a.observaciones) {
                      <p class="text-xs text-muted mt-1">{{ a.observaciones }}</p>
                    }
                  </div>
                  <span class="text-xs text-muted whitespace-nowrap">
                    {{ a.fecha_asignacion | date: 'dd/MM HH:mm' }}
                  </span>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </mat-dialog-content>

    <div class="flex justify-end px-6 py-3 border-t border-slate-100 bg-slate-50/60">
      <button mat-button type="button" mat-dialog-close>Cerrar</button>
    </div>
  `,
})
export class AsignacionesDialog implements OnInit {
  horario = inject<Horario>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private horarioService = inject(HorarioService);
  private wsService = inject(WorkstationService);
  private notify = inject(NotifyService);

  puestos = signal<Workstation[]>([]);
  asignaciones = signal<Asignacion[]>([]);
  cargando = signal(false);
  guardando = signal(false);

  puedeAsignar = computed(
    () => this.horario.estado === 'en_curso' || this.horario.estado === 'programado'
  );

  private mapaPuestos = computed(() => {
    const m = new Map<number, string>();
    for (const w of this.puestos()) m.set(w.id, w.codigo);
    return m;
  });

  form = this.fb.group({
    workstation_id: [null as number | null, Validators.required],
    codigo_alumno: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
    observaciones: ['', [Validators.maxLength(250)]],
  });

  ngOnInit() {
    this.wsService.getListadoPorLaboratorio(this.horario.laboratorio_id).subscribe({
      next: (ws) => this.puestos.set(ws),
      error: () => {},
    });
    this.cargarAsignaciones();
  }

  codigoPuesto(id: number): string {
    return this.mapaPuestos().get(id) ?? `Puesto #${id}`;
  }

  cargarAsignaciones() {
    this.cargando.set(true);
    this.horarioService.getAsignaciones(this.horario.id, { pagina: 1, tamano_pagina: 100 }).subscribe({
      next: (res) => {
        this.asignaciones.set(res.items);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.notify.error(err);
      },
    });
  }

  asignar() {
    if (this.form.invalid || this.guardando()) return;
    this.guardando.set(true);

    const v = this.form.getRawValue();
    this.horarioService
      .asignarWorkstation(this.horario.id, {
        workstation_id: Number(v.workstation_id),
        codigo_alumno: (v.codigo_alumno ?? '').trim().toUpperCase(),
        observaciones: v.observaciones?.trim() || null,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.notify.ok('Puesto asignado correctamente');
          this.form.reset();
          this.cargarAsignaciones();
        },
        error: (err) => {
          this.guardando.set(false);
          this.notify.error(err);
        },
      });
  }
}