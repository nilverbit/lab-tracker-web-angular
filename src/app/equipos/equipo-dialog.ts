import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { EquipoService } from '../core/services/equipo.service';
import { LaboratorioService } from '../core/services/laboratorio.service';
import { WorkstationService } from '../core/services/workstation.service';
import { NotifyService } from '../core/services/notify.service';
import { ESTADOS_EQUIPO, TIPOS_EQUIPO, Equipo, Laboratorio, Workstation } from '../core/models/modelos';

@Component({
  selector: 'app-equipo-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Nuevo' }} Equipo</h2>
    <mat-dialog-content class="pt-4"> 
      <form [formGroup]="form" class="grid grid-cols-2 gap-4 min-w-[500px]">
        <mat-form-field appearance="outline">
          <mat-label>Cód. Patrimonial</mat-label>
          <input matInput formControlName="codigo_patrimonial">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Tipo</mat-label>
          <mat-select formControlName="tipo">
            @for (t of tipos; track t) { <mat-option [value]="t" class="capitalize">{{ t }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Marca</mat-label>
          <input matInput formControlName="marca">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Modelo</mat-label>
          <input matInput formControlName="modelo">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Núm. Serie (Opcional)</mat-label>
          <input matInput formControlName="numero_serie">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Estado</mat-label>
          <mat-select formControlName="estado">
            @for (e of estados; track e) { <mat-option [value]="e">{{ e }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="col-span-2">
          <mat-label>Características</mat-label>
          <textarea matInput formControlName="caracteristicas" rows="2"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Laboratorio</mat-label>
          <mat-select formControlName="laboratorio_id" (selectionChange)="cargarPuestos($event.value)">
            @for (lab of laboratorios; track lab.id) { <mat-option [value]="lab.id">{{ lab.codigo }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Puesto (Opcional)</mat-label>
          <mat-select formControlName="workstation_id">
            <mat-option [value]="null">-- Sin asignar --</mat-option>
            @for (w of puestos; track w.id) { <mat-option [value]="w.id">{{ w.codigo }}</mat-option> }
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
export class EquipoDialog implements OnInit {
  data = inject<Equipo>(MAT_DIALOG_DATA, { optional: true });
  dialogRef = inject(MatDialogRef<EquipoDialog>);
  fb = inject(FormBuilder);
  equipoService = inject(EquipoService);
  labService = inject(LaboratorioService);
  wsService = inject(WorkstationService);
  notify = inject(NotifyService);
  
  tipos = TIPOS_EQUIPO;
  estados = ESTADOS_EQUIPO;
  laboratorios: Laboratorio[] = [];
  puestos: Workstation[] = [];

  form = this.fb.group({
    codigo_patrimonial: [this.data?.codigo_patrimonial || '', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    tipo: [this.data?.tipo || 'cpu', Validators.required],
    marca: [this.data?.marca || '', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    modelo: [this.data?.modelo || '', [Validators.required, Validators.minLength(1), Validators.maxLength(80)]],
    numero_serie: [this.data?.numero_serie || ''],
    caracteristicas: [this.data?.caracteristicas || '', [Validators.required, Validators.minLength(2), Validators.maxLength(500)]],
    estado: [this.data?.estado || 'operativo', Validators.required],
    laboratorio_id: [this.data?.laboratorio_id || null, Validators.required],
    workstation_id: [this.data?.workstation_id || null]
  });

  ngOnInit() {
    this.labService.getAll().subscribe(labs => this.laboratorios = labs);
    if (this.data?.laboratorio_id) {
      this.cargarPuestos(this.data.laboratorio_id);
    }
  }

  cargarPuestos(labId: number) {
    this.wsService.getByLaboratorio(labId).subscribe((ws: any) => this.puestos = ws);
  }

  guardar() {
    if (this.form.invalid) return;
    const peticion = this.data
      ? this.equipoService.update(this.data.id, this.form.value as any)
      : this.equipoService.create(this.form.value as any);

    peticion.subscribe({
      next: () => {
        this.notify.ok(`Equipo ${this.data ? 'actualizado' : 'creado'}`);
        this.dialogRef.close(true);
      },
      error: (err: any) => this.notify.error(err)
    });
  }
}