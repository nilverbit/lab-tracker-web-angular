import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { HorarioService } from '../core/services/horario.service';
import { LaboratorioService } from '../core/services/laboratorio.service';
import { AuthService } from '../core/services/auth.service';
import { NotifyService } from '../core/services/notify.service';
import { HorarioCreate, Laboratorio } from '../core/models/modelos';

@Component({
  selector: 'app-horario-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  template: `
    <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <mat-icon>event</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-ink leading-tight">Programar Nuevo Turno</h2>
          <p class="text-xs text-muted">Reserva un laboratorio para una sesión académica</p>
        </div>
      </div>
      <button mat-icon-button mat-dialog-close type="button" aria-label="Cerrar">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="pt-5! pb-2!">
      <form [formGroup]="form" (ngSubmit)="guardar()" class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:w-[480px]">
        <mat-form-field appearance="outline" class="sm:col-span-2">
          <mat-label>Laboratorio</mat-label>
          <mat-select formControlName="laboratorio_id">
            @for (lab of laboratorios(); track lab.id) {
              <mat-option [value]="lab.id">{{ lab.codigo }} — {{ lab.nombre }}</mat-option>
            }
          </mat-select>
          @if (form.controls.laboratorio_id.hasError('required')) {
            <mat-error>Selecciona un laboratorio</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="sm:col-span-2">
          <mat-label>Nombre del turno / asignatura</mat-label>
          <input matInput formControlName="nombre_turno" placeholder="Ej. Programación Orientada a Objetos - G1" />
          @if (form.controls.nombre_turno.hasError('required')) {
            <mat-error>Obligatorio</mat-error>
          } @else if (form.controls.nombre_turno.hasError('minlength')) {
            <mat-error>Mínimo 3 caracteres</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="sm:col-span-2">
          <mat-label>Docente responsable</mat-label>
          <input matInput formControlName="docente_responsable" placeholder="Ej. Ing. Carlos Mendoza" />
          @if (form.controls.docente_responsable.hasError('required')) {
            <mat-error>Obligatorio</mat-error>
          } @else if (form.controls.docente_responsable.hasError('minlength')) {
            <mat-error>Mínimo 3 caracteres</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="sm:col-span-2">
          <mat-label>Fecha</mat-label>
          <input matInput type="date" formControlName="fecha" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Hora inicio</mat-label>
          <input matInput type="time" formControlName="hora_inicio" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Hora fin</mat-label>
          <input matInput type="time" formControlName="hora_fin" />
        </mat-form-field>

        @if (horasInvalidas()) {
          <p class="sm:col-span-2 text-xs text-danger -mt-2">
            La hora de finalización debe ser posterior a la hora de inicio.
          </p>
        }
      </form>
    </mat-dialog-content>

    <div class="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
      <button mat-button type="button" mat-dialog-close [disabled]="guardando()">Cancelar</button>
      <button
        type="button"
        (click)="guardar()"
        [disabled]="form.invalid || horasInvalidas() || guardando()"
        class="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
        {{ guardando() ? 'Guardando...' : 'Programar turno' }}
      </button>
    </div>
  `,
})
export class HorarioDialog implements OnInit {
  private dialogRef = inject(MatDialogRef<HorarioDialog>);
  private fb = inject(FormBuilder);
  private horarioService = inject(HorarioService);
  private labService = inject(LaboratorioService);
  private auth = inject(AuthService);
  private notify = inject(NotifyService);

  laboratorios = signal<Laboratorio[]>([]);
  guardando = signal(false);

  form = this.fb.group({
    laboratorio_id: [null as number | null, Validators.required],
    nombre_turno: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    docente_responsable: [
      this.auth.esDocente() ? this.auth.nombreMostrado() : '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
    ],
    fecha: [new Date().toISOString().slice(0, 10), Validators.required],
    hora_inicio: ['08:00', Validators.required],
    hora_fin: ['10:00', Validators.required],
  });

  ngOnInit() {
    this.labService.getListadoCompleto(true).subscribe({
      next: (labs) => this.laboratorios.set(labs),
      error: () => {},
    });
  }

  horasInvalidas(): boolean {
    const ini = this.form.controls.hora_inicio.value;
    const fin = this.form.controls.hora_fin.value;
    return !!(ini && fin && fin <= ini);
  }

  guardar() {
    if (this.form.invalid || this.horasInvalidas() || this.guardando()) return;
    this.guardando.set(true);

    const v = this.form.getRawValue();
    const normalizarHora = (h: string) => (h.length === 5 ? `${h}:00` : h);

    const payload: HorarioCreate = {
      laboratorio_id: Number(v.laboratorio_id),
      nombre_turno: (v.nombre_turno ?? '').trim(),
      docente_responsable: (v.docente_responsable ?? '').trim(),
      fecha: v.fecha ?? '',
      hora_inicio: normalizarHora(v.hora_inicio ?? '08:00'),
      hora_fin: normalizarHora(v.hora_fin ?? '10:00'),
    };

    this.horarioService.create(payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.notify.ok('Horario programado correctamente');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.guardando.set(false);
        this.notify.error(err);
      },
    });
  }
}