import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { HorarioService } from '../core/services/horario.service';
import { LaboratorioService } from '../core/services/laboratorio.service';
import { NotifyService } from '../core/services/notify.service';
import { Laboratorio } from '../core/models/modelos';

@Component({
  selector: 'app-horario-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Programar Nuevo Horario</h2>
    <mat-dialog-content class="pt-4">
      <form [formGroup]="form" class="grid grid-cols-2 gap-4 min-w-[500px]">
        <mat-form-field appearance="outline" class="col-span-2">
          <mat-label>Laboratorio</mat-label>
          <mat-select formControlName="laboratorio_id">
            @for (lab of laboratorios; track lab.id) { <mat-option [value]="lab.id">{{ lab.codigo }} - {{ lab.nombre }}</mat-option> }
          </mat-select>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="col-span-2">
          <mat-label>Nombre del Turno</mat-label>
          <input matInput formControlName="nombre_turno" placeholder="Ej: Práctica de Redes II">
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="col-span-2">
          <mat-label>Docente Responsable</mat-label>
          <input matInput formControlName="docente_responsable">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Fecha</mat-label>
          <input matInput type="date" formControlName="fecha">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Hora Inicio</mat-label>
          <input matInput type="time" formControlName="hora_inicio">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Hora Fin</mat-label>
          <input matInput type="time" formControlName="hora_fin">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="guardar()">Guardar</button>
    </mat-dialog-actions>
  `
})
export class HorarioDialog implements OnInit {
  dialogRef = inject(MatDialogRef<HorarioDialog>);
  fb = inject(FormBuilder);
  horarioService = inject(HorarioService);
  labService = inject(LaboratorioService);
  notify = inject(NotifyService);
  
  laboratorios: Laboratorio[] = [];

  form = this.fb.group({
    laboratorio_id: [null, Validators.required],
    nombre_turno: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    docente_responsable: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    fecha: ['', Validators.required],
    hora_inicio: ['', Validators.required],
    hora_fin: ['', Validators.required]
  });

  ngOnInit() {
    this.labService.getAll().subscribe(labs => this.laboratorios = labs);
  }

  guardar() {
    if (this.form.invalid) return;
    const vals = this.form.value;
    const payload = {
      ...vals,
      hora_inicio: vals.hora_inicio + ':00', // Adaptamos al formato HH:MM:SS de FastAPI
      hora_fin: vals.hora_fin + ':00'
    };

    this.horarioService.create(payload as any).subscribe({
      next: () => {
        this.notify.ok('Horario programado');
        this.dialogRef.close(true);
      },
      error: (err) => this.notify.error(err)
    });
  }
}