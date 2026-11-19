import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';

import { RolService } from '../core/services/rol.service';
import { NotifyService } from '../core/services/notify.service';
import { Rol, RolCreate } from '../core/models/modelos';

@Component({
  selector: 'app-rol-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatIconModule,
  ],
  template: `
    <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <mat-icon>admin_panel_settings</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-ink leading-tight">
            {{ data ? 'Editar Rol' : 'Nuevo Rol' }}
          </h2>
          <p class="text-xs text-muted">Define el nombre, alcance y vigencia del rol</p>
        </div>
      </div>
      <button mat-icon-button mat-dialog-close type="button" aria-label="Cerrar">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="pt-5! pb-2!">
      <form [formGroup]="form" (ngSubmit)="guardar()" class="flex flex-col gap-3 w-full sm:w-[440px]">
        <mat-form-field appearance="outline">
          <mat-label>Nombre del rol</mat-label>
          <input matInput formControlName="nombre" placeholder="Ej. docente" />
          @if (form.controls.nombre.hasError('required')) {
            <mat-error>Obligatorio</mat-error>
          } @else if (form.controls.nombre.hasError('minlength')) {
            <mat-error>Mínimo 3 caracteres</mat-error>
          } @else if (form.controls.nombre.hasError('maxlength')) {
            <mat-error>Máximo 50 caracteres</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Descripción y alcance</mat-label>
          <textarea
            matInput
            formControlName="descripcion"
            rows="3"
            placeholder="Describe qué módulos o acciones puede ejecutar este rol"></textarea>
          @if (form.controls.descripcion.hasError('required')) {
            <mat-error>Obligatorio</mat-error>
          } @else if (form.controls.descripcion.hasError('minlength')) {
            <mat-error>Mínimo 3 caracteres</mat-error>
          } @else if (form.controls.descripcion.hasError('maxlength')) {
            <mat-error>Máximo 250 caracteres</mat-error>
          }
        </mat-form-field>

        <div class="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-ink">Rol activo</p>
            <p class="text-xs text-muted">Los roles inactivos no deben asignarse a nuevos usuarios</p>
          </div>
          <mat-slide-toggle formControlName="es_activo" color="primary" />
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
        {{ guardando() ? 'Guardando...' : (data ? 'Guardar cambios' : 'Crear rol') }}
      </button>
    </div>
  `,
})
export class RolDialog {
  data = inject<Rol | null>(MAT_DIALOG_DATA, { optional: true });
  private dialogRef = inject(MatDialogRef<RolDialog>);
  private fb = inject(FormBuilder);
  private rolService = inject(RolService);
  private notify = inject(NotifyService);

  guardando = signal(false);

  form = this.fb.nonNullable.group({
    nombre: [
      this.data?.nombre ?? '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(50)],
    ],
    descripcion: [
      this.data?.descripcion ?? '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(250)],
    ],
    es_activo: [this.data?.es_activo ?? true],
  });

  guardar() {
    if (this.form.invalid || this.guardando()) return;
    this.guardando.set(true);

    const v = this.form.getRawValue();
    const payload: RolCreate = {
      nombre: v.nombre.trim(),
      descripcion: v.descripcion.trim(),
      es_activo: v.es_activo,
    };

    const peticion = this.data
      ? this.rolService.update(this.data.id, payload)
      : this.rolService.create(payload);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.notify.ok(`Rol ${this.data ? 'actualizado' : 'creado'} correctamente`);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.guardando.set(false);
        this.notify.error(err);
      },
    });
  }
}