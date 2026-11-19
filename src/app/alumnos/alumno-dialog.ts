import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { AlumnoService } from '../core/services/alumno.service';
import { NotifyService } from '../core/services/notify.service';
import {
  Alumno,
  AlumnoCreate,
  ESTADOS_ALUMNO,
  EstadoAlumno,
  TIPOS_DOCUMENTO,
  TipoDocumento,
} from '../core/models/modelos';

const PATRON_CODIGO = /^[A-Z0-9\-_]+$/;
const PATRON_CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

@Component({
  selector: 'app-alumno-dialog',
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
          <mat-icon>school</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-ink leading-tight">
            {{ data ? 'Editar Alumno' : 'Registrar Nuevo Alumno' }}
          </h2>
          <p class="text-xs text-muted">Datos académicos, identificación y contacto del estudiante</p>
        </div>
      </div>
      <button mat-icon-button mat-dialog-close type="button" aria-label="Cerrar">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="pt-5! pb-2!">
      <form [formGroup]="form" (ngSubmit)="guardar()" class="flex flex-col gap-4 w-full sm:w-[620px]">
        <!-- Sección 1: Identificación -->
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">
            1. Identificación Personal
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <mat-form-field appearance="outline">
              <mat-label>Código universitario</mat-label>
              <input
                matInput
                formControlName="codigo"
                placeholder="Ej. 27250102"
                (blur)="normalizarCodigo()" />
              @if (form.controls.codigo.hasError('required')) {
                <mat-error>Obligatorio</mat-error>
              } @else if (form.controls.codigo.hasError('minlength')) {
                <mat-error>Mínimo 3 caracteres</mat-error>
              } @else if (form.controls.codigo.hasError('pattern')) {
                <mat-error>Solo A-Z, 0-9, - y _</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Tipo de documento</mat-label>
              <mat-select formControlName="tipo_documento">
                @for (td of tiposDocumento; track td) {
                  <mat-option [value]="td" class="capitalize">{{ td.replaceAll('_', ' ') }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>N° documento (opcional)</mat-label>
              <input matInput formControlName="numero_documento" placeholder="Ej. 71234567" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="sm:col-span-3 md:col-span-1">
              <mat-label>Nombres</mat-label>
              <input matInput formControlName="nombres" />
              @if (form.controls.nombres.hasError('required')) {
                <mat-error>Obligatorio</mat-error>
              } @else if (form.controls.nombres.hasError('minlength')) {
                <mat-error>Mínimo 2 caracteres</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="sm:col-span-3 md:col-span-2">
              <mat-label>Apellidos</mat-label>
              <input matInput formControlName="apellidos" />
              @if (form.controls.apellidos.hasError('required')) {
                <mat-error>Obligatorio</mat-error>
              } @else if (form.controls.apellidos.hasError('minlength')) {
                <mat-error>Mínimo 2 caracteres</mat-error>
              }
            </mat-form-field>
          </div>
        </div>

        <!-- Sección 2: Datos Académicos -->
        <div class="pt-2 border-t border-slate-100">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">
            2. Información Académica
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <mat-form-field appearance="outline" class="sm:col-span-2">
              <mat-label>Carrera profesional</mat-label>
              <input matInput formControlName="carrera" placeholder="Ej. Ingeniería de Sistemas" />
              @if (form.controls.carrera.hasError('required')) {
                <mat-error>Obligatorio</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Estado</mat-label>
              <mat-select formControlName="estado">
                @for (est of estados; track est) {
                  <mat-option [value]="est" class="capitalize">{{ est }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Semestre / Ciclo (1-20)</mat-label>
              <input matInput type="number" min="1" max="20" formControlName="semestre" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Grupo / Sección</mat-label>
              <input matInput formControlName="grupo" placeholder="Ej. A, G1" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Fecha de ingreso</mat-label>
              <input matInput type="date" formControlName="fecha_ingreso" />
            </mat-form-field>
          </div>
        </div>

        <!-- Sección 3: Contacto -->
        <div class="pt-2 border-t border-slate-100">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">
            3. Contacto y Adicionales
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <mat-form-field appearance="outline">
              <mat-label>Correo institucional</mat-label>
              <input matInput type="email" formControlName="correo_institucional" placeholder="alumno@unsch.edu.pe" />
              @if (form.controls.correo_institucional.hasError('required')) {
                <mat-error>Obligatorio</mat-error>
              } @else if (form.controls.correo_institucional.hasError('pattern')) {
                <mat-error>Correo no válido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Correo personal (opcional)</mat-label>
              <input matInput type="email" formControlName="correo_personal" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Teléfono (opcional)</mat-label>
              <input matInput formControlName="telefono" placeholder="Ej. 966123456" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Fecha de nacimiento (opcional)</mat-label>
              <input matInput type="date" formControlName="fecha_nacimiento" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="sm:col-span-2">
              <mat-label>Observaciones (opcional)</mat-label>
              <textarea matInput formControlName="observaciones" rows="2"></textarea>
            </mat-form-field>
          </div>
        </div>
      </form>
    </mat-dialog-content>

    <div class="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
      <button mat-button type="button" mat-dialog-close [disabled]="guardando()">Cancelar</button>
      <button
        type="button"
        (click)="guardar()"
        [disabled]="form.invalid || guardando()"
        class="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
        {{ guardando() ? 'Guardando...' : (data ? 'Guardar cambios' : 'Registrar alumno') }}
      </button>
    </div>
  `,
})
export class AlumnoDialog {
  data = inject<Alumno | null>(MAT_DIALOG_DATA, { optional: true });
  private dialogRef = inject(MatDialogRef<AlumnoDialog>);
  private fb = inject(FormBuilder);
  private alumnoService = inject(AlumnoService);
  private notify = inject(NotifyService);

  tiposDocumento = TIPOS_DOCUMENTO;
  estados = ESTADOS_ALUMNO;
  guardando = signal(false);

  form = this.fb.group({
    codigo: [
      this.data?.codigo ?? '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern(PATRON_CODIGO),
      ],
    ],
    nombres: [
      this.data?.nombres ?? '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    apellidos: [
      this.data?.apellidos ?? '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    tipo_documento: [(this.data?.tipo_documento ?? 'dni') as TipoDocumento, [Validators.required]],
    numero_documento: [this.data?.numero_documento ?? '', [Validators.maxLength(20)]],
    correo_institucional: [
      this.data?.correo_institucional ?? '',
      [Validators.required, Validators.maxLength(150), Validators.pattern(PATRON_CORREO)],
    ],
    correo_personal: [this.data?.correo_personal ?? '', [Validators.maxLength(150)]],
    telefono: [this.data?.telefono ?? '', [Validators.maxLength(20)]],
    fecha_nacimiento: [this.data?.fecha_nacimiento ?? ''],
    carrera: [
      this.data?.carrera ?? '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(120)],
    ],
    semestre: [
      this.data?.semestre ?? (null as number | null),
      [Validators.min(1), Validators.max(20)],
    ],
    grupo: [this.data?.grupo ?? '', [Validators.maxLength(20)]],
    estado: [(this.data?.estado ?? 'activo') as EstadoAlumno, [Validators.required]],
    fecha_ingreso: [this.data?.fecha_ingreso ?? new Date().toISOString().slice(0, 10)],
    observaciones: [this.data?.observaciones ?? '', [Validators.maxLength(500)]],
  });

  normalizarCodigo() {
    const val = this.form.controls.codigo.value ?? '';
    this.form.controls.codigo.setValue(val.trim().toUpperCase().replace(/\s+/g, '-'));
  }

  guardar() {
    this.normalizarCodigo();
    if (this.form.invalid || this.guardando()) return;
    this.guardando.set(true);

    const v = this.form.getRawValue();
    const payload: AlumnoCreate = {
      codigo: (v.codigo ?? '').trim().toUpperCase(),
      nombres: (v.nombres ?? '').trim(),
      apellidos: (v.apellidos ?? '').trim(),
      tipo_documento: v.tipo_documento ?? 'dni',
      numero_documento: v.numero_documento?.trim() || null,
      correo_institucional: (v.correo_institucional ?? '').trim().toLowerCase(),
      correo_personal: v.correo_personal?.trim().toLowerCase() || null,
      telefono: v.telefono?.trim() || null,
      fecha_nacimiento: v.fecha_nacimiento || null,
      carrera: (v.carrera ?? '').trim(),
      semestre:
        v.semestre !== null && v.semestre !== ('' as unknown) ? Number(v.semestre) : null,
      grupo: v.grupo?.trim() || null,
      estado: v.estado ?? 'activo',
      ...(v.fecha_ingreso ? { fecha_ingreso: v.fecha_ingreso } : {}),
      observaciones: v.observaciones?.trim() || null,
    };

    const peticion = this.data
      ? this.alumnoService.update(this.data.id, payload)
      : this.alumnoService.create(payload);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.notify.ok(`Alumno ${this.data ? 'actualizado' : 'registrado'} correctamente`);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.guardando.set(false);
        this.notify.error(err);
      },
    });
  }
}