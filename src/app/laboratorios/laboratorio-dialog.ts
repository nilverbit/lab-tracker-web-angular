import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LaboratorioService } from '../core/services/laboratorio.service';
import { NotifyService } from '../core/services/notify.service';
import { ESTADOS_LABORATORIO, Laboratorio } from '../core/models/modelos';

@Component({
  selector: 'app-laboratorio-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Nuevo' }} Laboratorio</h2>
    <mat-dialog-content class="pt-4">
      <form [formGroup]="form" class="flex flex-col gap-4 min-w-[350px]">
        <mat-form-field appearance="outline">
          <mat-label>Código</mat-label>
          <input matInput formControlName="codigo" placeholder="Ej: LAB-01">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Ubicación</mat-label>
          <input matInput formControlName="ubicacion">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Capacidad (Puestos)</mat-label>
          <input matInput type="number" formControlName="capacidad_workstations">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Estado</mat-label>
          <mat-select formControlName="estado">
            @for (est of estados; track est) {
              <mat-option [value]="est">{{ est }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="guardar()">Guardar</button>
    </mat-dialog-actions>
  `
})
export class LaboratorioDialog {
  data = inject<Laboratorio>(MAT_DIALOG_DATA, { optional: true });
  dialogRef = inject(MatDialogRef<LaboratorioDialog>);
  fb = inject(FormBuilder);
  labService = inject(LaboratorioService);
  notify = inject(NotifyService);
  estados = ESTADOS_LABORATORIO;

  form = this.fb.group({
    codigo: [this.data?.codigo || '', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
    nombre: [this.data?.nombre || '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    ubicacion: [this.data?.ubicacion || '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    capacidad_workstations: [this.data?.capacidad_workstations || 1, [Validators.required, Validators.min(1)]],
    estado: [this.data?.estado || 'disponible', Validators.required]
  });

  guardar() {
    if (this.form.invalid) return;
    const peticion = this.data
      ? this.labService.update(this.data.id, this.form.value as any)
      : this.labService.create(this.form.value as any);

    peticion.subscribe({
      next: (res) => {
        this.notify.ok(`Laboratorio ${this.data ? 'actualizado' : 'creado'}`);
        this.dialogRef.close(true);
      },
      error: (err) => this.notify.error(err)
    });
  }
}