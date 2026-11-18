import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { WorkstationService } from '../core/services/workstation.service';
import { NotifyService } from '../core/services/notify.service';
import { ESTADOS_WORKSTATION, Workstation } from '../core/models/modelos';

@Component({
  selector: 'app-puesto-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data.puesto ? 'Editar' : 'Nuevo' }} Puesto</h2>
    <mat-dialog-content class="pt-4">
      <form [formGroup]="form" class="flex flex-col gap-4 min-w-[350px]">
        <mat-form-field appearance="outline">
          <mat-label>Código</mat-label>
          <input matInput formControlName="codigo" placeholder="Ej: PC-01">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Ubicación Interna</mat-label>
          <input matInput formControlName="ubicacion_interna" placeholder="Ej: Fila 1, Derecha">
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
export class PuestoDialog {
  data = inject<{puesto?: Workstation, laboratorio_id: number}>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<PuestoDialog>);
  fb = inject(FormBuilder);
  wsService = inject(WorkstationService);
  notify = inject(NotifyService);
  estados = ESTADOS_WORKSTATION;

  form = this.fb.group({
    codigo: [this.data.puesto?.codigo || '', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]],
    ubicacion_interna: [this.data.puesto?.ubicacion_interna || '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    estado: [this.data.puesto?.estado || 'disponible', Validators.required],
    laboratorio_id: [this.data.laboratorio_id] // Siempre lo enviamos oculto
  });

  guardar() {
    if (this.form.invalid) return;
    const peticion = this.data.puesto
      ? this.wsService.update(this.data.puesto.id, this.form.value as any)
      : this.wsService.create(this.form.value as any);

    peticion.subscribe({
      next: () => {
        this.notify.ok(`Puesto ${this.data.puesto ? 'actualizado' : 'creado'}`);
        this.dialogRef.close(true);
      },
      error: (err) => this.notify.error(err)
    });
  }
}