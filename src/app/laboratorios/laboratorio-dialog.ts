import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { LaboratorioService } from '../core/services/laboratorio.service';
import { NotifyService } from '../core/services/notify.service';
import {
  ESTADOS_LABORATORIO,
  EstadoLaboratorio,
  Laboratorio,
  LaboratorioCreate,
} from '../core/models/modelos';

@Component({
  selector: 'app-laboratorio-dialog',
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
          <mat-icon>science</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-ink leading-tight">
            {{ data ? 'Editar Laboratorio' : 'Nuevo Laboratorio' }}
          </h2>
          <p class="text-xs text-muted">
            {{ data ? 'Actualiza los datos e infraestructura del aula' : 'Registra un nuevo ambiente de cómputo' }}
          </p>
        </div>
      </div>
      <button mat-icon-button mat-dialog-close type="button" aria-label="Cerrar">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="pt-5! pb-2!">
      <form [formGroup]="form" (ngSubmit)="guardar()" class="flex flex-col gap-3 w-full sm:w-[460px]">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <mat-form-field appearance="outline">
            <mat-label>Código</mat-label>
            <input matInput formControlName="codigo" placeholder="Ej. LAB-01" />
            @if (form.controls.codigo.hasError('required')) {
              <mat-error>Obligatorio</mat-error>
            } @else if (form.controls.codigo.hasError('minlength')) {
              <mat-error>Mínimo 2 caracteres</mat-error>
            } @else if (form.controls.codigo.hasError('maxlength')) {
              <mat-error>Máximo 20 caracteres</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Capacidad (puestos)</mat-label>
            <input matInput type="number" min="1" formControlName="capacidad_workstations" />
            @if (form.controls.capacidad_workstations.hasError('required')) {
              <mat-error>Obligatorio</mat-error>
            } @else if (form.controls.capacidad_workstations.hasError('min')) {
              <mat-error>Debe ser mayor a 0</mat-error>
            }
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Nombre del laboratorio</mat-label>
          <input matInput formControlName="nombre" placeholder="Ej. Laboratorio de Redes y Sistemas" />
          @if (form.controls.nombre.hasError('required')) {
            <mat-error>Obligatorio</mat-error>
          } @else if (form.controls.nombre.hasError('minlength')) {
            <mat-error>Mínimo 2 caracteres</mat-error>
          }
        </mat-form-field>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <mat-form-field appearance="outline">
            <mat-label>Ubicación</mat-label>
            <input matInput formControlName="ubicacion" placeholder="Ej. Pabellón H - Piso 2" />
            @if (form.controls.ubicacion.hasError('required')) {
              <mat-error>Obligatorio</mat-error>
            } @else if (form.controls.ubicacion.hasError('minlength')) {
              <mat-error>Mínimo 2 caracteres</mat-error>
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
        </div>

        <mat-form-field appearance="outline">
          <mat-label>URL de imagen (opcional)</mat-label>
          <mat-icon matPrefix class="mr-2 text-muted!">image</mat-icon>
          <input
            matInput
            formControlName="url_imagen"
            placeholder="https://ejemplo.com/foto-lab.jpg"
            (input)="imagenInvalida.set(false)" />
          @if (form.controls.url_imagen.hasError('maxlength')) {
            <mat-error>Máximo 500 caracteres</mat-error>
          }
        </mat-form-field>

        @if (form.controls.url_imagen.value.trim() && !imagenInvalida()) {
          <div class="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-32">
            <img
              [src]="form.controls.url_imagen.value.trim()"
              alt="Vista previa del laboratorio"
              class="w-full h-full object-cover"
              (error)="imagenInvalida.set(true)" />
          </div>
        }
      </form>
    </mat-dialog-content>

    <div class="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
      <button mat-button type="button" mat-dialog-close [disabled]="guardando()">Cancelar</button>
      <button
        type="button"
        (click)="guardar()"
        [disabled]="form.invalid || guardando()"
        class="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
        {{ guardando() ? 'Guardando...' : (data ? 'Guardar cambios' : 'Crear laboratorio') }}
      </button>
    </div>
  `,
})
export class LaboratorioDialog {
  data = inject<Laboratorio | null>(MAT_DIALOG_DATA, { optional: true });
  private dialogRef = inject(MatDialogRef<LaboratorioDialog>);
  private fb = inject(FormBuilder);
  private labService = inject(LaboratorioService);
  private notify = inject(NotifyService);

  estados = ESTADOS_LABORATORIO;
  guardando = signal(false);
  imagenInvalida = signal(false);

  form = this.fb.nonNullable.group({
    codigo: [
      this.data?.codigo ?? '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(20)],
    ],
    nombre: [
      this.data?.nombre ?? '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    ubicacion: [
      this.data?.ubicacion ?? '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    capacidad_workstations: [
      this.data?.capacidad_workstations ?? 20,
      [Validators.required, Validators.min(1)],
    ],
    estado: [
      (this.data?.estado ?? 'disponible') as EstadoLaboratorio,
      [Validators.required],
    ],
    url_imagen: [this.data?.url_imagen ?? '', [Validators.maxLength(500)]],
  });

  guardar() {
    if (this.form.invalid || this.guardando()) return;
    this.guardando.set(true);

    const raw = this.form.getRawValue();
    const payload: LaboratorioCreate = {
      codigo: raw.codigo.trim(),
      nombre: raw.nombre.trim(),
      ubicacion: raw.ubicacion.trim(),
      capacidad_workstations: Number(raw.capacidad_workstations),
      estado: raw.estado,
      url_imagen: raw.url_imagen.trim() || null,
    };

    const peticion = this.data
      ? this.labService.update(this.data.id, payload)
      : this.labService.create(payload);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.notify.ok(`Laboratorio ${this.data ? 'actualizado' : 'creado'} correctamente`);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.guardando.set(false);
        this.notify.error(err);
      },
    });
  }
}