import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { WorkstationService } from '../core/services/workstation.service';
import { LaboratorioService } from '../core/services/laboratorio.service';
import { NotifyService } from '../core/services/notify.service';
import { ConfirmService } from '../shared/confirm-dialog';
import { StatusChip } from '../shared/status-chip';
import { PageHeader } from '../shared/page-header';
import { PuestoDialog } from './puesto-dialog';
import { Workstation, Laboratorio } from '../core/models/modelos';

@Component({
  selector: 'app-puestos',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatSelectModule, MatTooltipModule, StatusChip, PageHeader],
  template: `
    <app-page-header titulo="Puestos de Trabajo" subtitulo="Gestión de mesas/workstations por laboratorio">
      <button mat-flat-button color="primary" (click)="abrirDialogo()" [disabled]="!labSeleccionado">
        <mat-icon>add</mat-icon> Nuevo Puesto
      </button>
    </app-page-header>

    <div class="p-6">
      <div class="mb-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
        <div class="w-72">
          <mat-label class="text-sm font-medium text-muted block mb-1">Seleccionar Laboratorio</mat-label>
          <mat-select [(ngModel)]="labSeleccionado" (selectionChange)="cargar()" class="bg-page px-3 py-2 rounded-md border border-gray-200 w-full">
            <mat-option [value]="null">-- Seleccione un laboratorio --</mat-option>
            @for (lab of laboratorios; track lab.id) {
              <mat-option [value]="lab.id">{{ lab.codigo }} - {{ lab.nombre }}</mat-option>
            }
          </mat-select>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table mat-table [dataSource]="datos()" class="w-full">
          
          <ng-container matColumnDef="codigo">
            <th mat-header-cell *matHeaderCellDef> Código </th>
            <td mat-cell *matCellDef="let element" class="font-bold text-ink"> {{element.codigo}} </td>
          </ng-container>

          <ng-container matColumnDef="ubicacion">
            <th mat-header-cell *matHeaderCellDef> Ubicación Interna </th>
            <td mat-cell *matCellDef="let element"> {{element.ubicacion_interna}} </td>
          </ng-container>

          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef> Estado </th>
            <td mat-cell *matCellDef="let element">
              <app-status-chip [valor]="element.estado" />
            </td>
          </ng-container>

          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef class="text-right"> Acciones </th>
            <td mat-cell *matCellDef="let element" class="text-right">
              <button mat-icon-button color="primary" matTooltip="Editar" (click)="abrirDialogo(element)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" matTooltip="Eliminar" (click)="eliminar(element)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columnas"></tr>
          <tr mat-row *matRowDef="let row; columns: columnas;" class="hover:bg-slate-50 transition-colors"></tr>
          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell text-center py-8 text-muted" [attr.colspan]="columnas.length">
              @if (!labSeleccionado) { Seleccione un laboratorio para ver sus puestos. }
              @else { No hay puestos registrados en este laboratorio. }
            </td>
          </tr>
        </table>
      </div>
    </div>
  `
})
export class Puestos implements OnInit {
  wsService = inject(WorkstationService);
  labService = inject(LaboratorioService);
  dialog = inject(MatDialog);
  notify = inject(NotifyService);
  confirm = inject(ConfirmService);

  datos = signal<Workstation[]>([]);
  laboratorios: Laboratorio[] = [];
  labSeleccionado: number | null = null;
  columnas = ['codigo', 'ubicacion', 'estado', 'acciones'];

  ngOnInit() {
    this.labService.getAll(false).subscribe(labs => this.laboratorios = labs);
  }

  cargar() {
    if (!this.labSeleccionado) {
      this.datos.set([]);
      return;
    }
    this.wsService.getByLaboratorio(this.labSeleccionado).subscribe({
      next: (res) => this.datos.set(res),
      error: (err) => this.notify.error(err)
    });
  }

  abrirDialogo(puesto?: Workstation) {
    if (!this.labSeleccionado) return;
    const ref = this.dialog.open(PuestoDialog, { 
      data: { puesto, laboratorio_id: this.labSeleccionado }, 
      disableClose: true 
    });
    ref.afterClosed().subscribe(cambio => { if (cambio) this.cargar(); });
  }

  eliminar(puesto: Workstation) {
    this.confirm.pedir({
      titulo: 'Eliminar Puesto',
      mensaje: `¿Seguro de eliminar el puesto ${puesto.codigo}? Sus equipos asignados quedarán sin puesto.`,
      textoConfirmar: 'Eliminar'
    }).subscribe(ok => {
      if (ok) {
        this.wsService.delete(puesto.id).subscribe({
          next: () => {
            this.notify.ok('Puesto eliminado');
            this.cargar();
          },
          error: (err) => this.notify.error(err)
        });
      }
    });
  }
}