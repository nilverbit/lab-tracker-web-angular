import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { IncidenteService } from '../core/services/incidente.service';
import { EquipoService } from '../core/services/equipo.service';
import { NotifyService } from '../core/services/notify.service';
import { PRIORIDADES, ESTADOS_INCIDENTE, Incidente, Equipo } from '../core/models/modelos';

@Component({
  selector: 'app-incidente-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Reportar' }} Incidente</h2>
    <mat-dialog-content class="pt-4">
      <form [formGroup]="form" class="grid grid-cols-2 gap-4 min-w-[500px]">
        <mat-form-field appearance="outline" class="col-span-2">
          <mat-label>Reportado por (Nombre)</mat-label>
          <input matInput formControlName="reportado_por" placeholder="Ej: Juan Pérez">
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="col-span-2">
          <mat-label>Descripción Detallada</mat-label>
          <textarea matInput formControlName="descripcion" rows="3"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Prioridad</mat-label>
          <mat-select formControlName="prioridad">
            @for (p of prioridades; track p) { <mat-option [value]="p" class="capitalize">{{ p }}</mat-option> }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Estado</mat-label>
          <mat-select formControlName="estado">
            @for (e of estados; track e) { <mat-option [value]="e" class="capitalize">{{ e.replace('_', ' ') }}</mat-option> }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="col-span-2">
          <mat-label>Equipo Afectado (Opcional)</mat-label>
          <mat-select formControlName="equipo_id">
            <mat-option [value]="null">-- Sin equipo --</mat-option>
            @for (eq of equipos; track eq.id) { <mat-option [value]="eq.id">{{ eq.codigo_patrimonial }} ({{eq.tipo}})</mat-option> }
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
export class IncidenteDialog implements OnInit {
  data = inject<Incidente>(MAT_DIALOG_DATA, { optional: true });
  dialogRef = inject(MatDialogRef<IncidenteDialog>);
  fb = inject(FormBuilder);
  incidenteService = inject(IncidenteService);
  equipoService = inject(EquipoService);
  notify = inject(NotifyService);
  
  prioridades = PRIORIDADES;
  estados = ESTADOS_INCIDENTE;
  equipos: Equipo[] = [];

  form = this.fb.group({
    reportado_por: [this.data?.reportado_por || '', [Validators.required, Validators.minLength(3)]],
    descripcion: [this.data?.descripcion || '', [Validators.required, Validators.minLength(5)]],
    prioridad: [this.data?.prioridad || 'media', Validators.required],
    estado: [this.data?.estado || 'pendiente', Validators.required],
    workstation_id: [this.data?.workstation_id || null],
    equipo_id: [this.data?.equipo_id || null]
  });

  ngOnInit() {
    this.equipoService.getAll().subscribe((eq: any) => this.equipos = eq);
  }

  guardar() {
    if (this.form.invalid) return;
    const peticion = this.data
      ? this.incidenteService.update(this.data.id, this.form.value as any)
      : this.incidenteService.create(this.form.value as any);

    peticion.subscribe({
      next: () => {
        this.notify.ok(`Incidente guardado`);
        this.dialogRef.close(true);
      },
      error: (err: any) => this.notify.error(err)
    });
  }
}