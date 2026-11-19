import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { WorkstationService } from '../core/services/workstation.service';
import { NotifyService } from '../core/services/notify.service';
import {
  ESTADOS_WORKSTATION,
  EstadoWorkstation,
  Workstation,
  WorkstationCreate,
} from '../core/models/modelos';

export interface PuestoDialogData {
  puesto?: Workstation;
  laboratorio_id: number;
  laboratorio_nombre?: string;
}

@Component({
  selector: 'app-puesto-dialog',
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
          <mat-icon>desktop_windows</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-ink leading-tight">
            {{ data.puesto ? 'Editar Puesto' : 'Nuevo Puesto' }}
          </h2>
          <p class="text-xs text-muted">
            {{ data.laboratorio_nombre || 'Laboratorio #' + data.laboratorio_id }}
          </p>
        </div>
      </div>
      <button mat-icon-button mat-dialog-close type="button" aria-label="Cerrar">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="pt-5! pb-2!">
      <form [formGroup]="form" (ngSubmit)="guardar()" class="flex flex-col gap-3 w-full sm:w-[420px]">
        <mat-form-field appearance="outline">
          <mat-label>Código del puesto</mat-label>
          <input matInput formControlName="codigo" placeholder="Ej. PC-01" />
          @if (form.controls.codigo.hasError('required')) {
            <mat-error>Obligatorio</mat-error>
          } @else if (form.controls.codigo.hasError('minlength')) {
            <mat-error>Mínimo 2 caracteres</mat-error>
          } @else if (form.controls.codigo.hasError('maxlength')) {
            <mat-error>Máximo 30 caracteres</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Ubicación interna</mat-label>
          <input matInput formControlName="ubicacion_interna" placeholder="Ej. Fila 1 - Columna A" />
          @if (form.controls.ubicacion_interna.hasError('required')) {
            <mat-error>Obligatorio</mat-error>
          } @else if (form.controls.ubicacion_interna.hasError('minlength')) {
            <mat-error>Mínimo 2 caracteres</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Estado</mat-label>
          <mat-select formControlName="estado">
            @for (est of estados; track est) {
              <mat-option [value]="est" class="capitalize">{{ est.replaceAll('_', ' ') }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <div class="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
      <button mat-button type="button" mat-dialog-close [disabled]="guardando()">Cancelar</button>
      <button
        type="button"
        (click)="guardar()"
        [disabled]="form.invalid || guardando()"
        class="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
        {{ guardando() ? 'Guardando...' : (data.puesto ? 'Guardar cambios' : 'Crear puesto') }}
      </button>
    </div>
  `,
})
export class PuestoDialog {
  data = inject<PuestoDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<PuestoDialog>);
  private fb = inject(FormBuilder);
  private wsService = inject(WorkstationService);
  private notify = inject(NotifyService);

  estados = ESTADOS_WORKSTATION;
  guardando = signal(false);

  form = this.fb.nonNullable.group({
    codigo: [
      this.data.puesto?.codigo ?? '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(30)],
    ],
    ubicacion_interna: [
      this.data.puesto?.ubicacion_interna ?? '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    estado: [
      (this.data.puesto?.estado ?? 'disponible') as EstadoWorkstation,
      [Validators.required],
    ],
  });

  guardar() {
    if (this.form.invalid || this.guardando()) return;
    this.guardando.set(true);

    const raw = this.form.getRawValue();
    const payload: WorkstationCreate = {
      codigo: raw.codigo.trim(),
      ubicacion_interna: raw.ubicacion_interna.trim(),
      estado: raw.estado,
      laboratorio_id: this.data.laboratorio_id,
    };

    const peticion = this.data.puesto
      ? this.wsService.update(this.data.puesto.id, payload)
      : this.wsService.create(payload);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.notify.ok(`Puesto ${this.data.puesto ? 'actualizado' : 'creado'} correctamente`);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.guardando.set(false);
        this.notify.error(err);
      },
    });
  }
}