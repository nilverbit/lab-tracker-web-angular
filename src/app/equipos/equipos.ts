import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EquipoService } from '../core/services/equipo.service';
import { LaboratorioService } from '../core/services/laboratorio.service';
import { NotifyService } from '../core/services/notify.service';
import { ConfirmService } from '../shared/confirm-dialog';
import { StatusChip } from '../shared/status-chip';
import { PageHeader } from '../shared/page-header';
import { EquipoDialog } from './equipo-dialog';
import { Equipo, Laboratorio, TIPOS_EQUIPO } from '../core/models/modelos';

@Component({
  selector: 'app-equipos',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatSelectModule, MatTooltipModule, StatusChip, PageHeader],
  template: `
    <app-page-header titulo="Inventario de Equipos" subtitulo="Gestión de hardware y componentes">
      <button mat-flat-button color="primary" (click)="abrirDialogo()">
        <mat-icon>add</mat-icon> Nuevo Equipo
      </button>
    </app-page-header>

    <div class="p-6">
      <div class="mb-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-4">
        <div class="w-72">
          <mat-label class="text-sm font-medium text-muted block mb-1">Filtrar por Laboratorio</mat-label>
          <mat-select [(ngModel)]="labSeleccionado" (selectionChange)="cargar()" class="bg-page px-3 py-2 rounded-md border border-gray-200 w-full">
            <mat-option [value]="null">Todos los laboratorios</mat-option>
            @for (lab of laboratorios; track lab.id) {
              <mat-option [value]="lab.id">{{ lab.codigo }}</mat-option>
            }
          </mat-select>
        </div>
        
        <div class="w-48">
          <mat-label class="text-sm font-medium text-muted block mb-1">Filtrar por Tipo</mat-label>
          <mat-select [(ngModel)]="tipoSeleccionado" (selectionChange)="cargar()" class="bg-page px-3 py-2 rounded-md border border-gray-200 w-full">
            <mat-option [value]="null">Todos los tipos</mat-option>
            @for (t of tipos; track t) { <mat-option [value]="t" class="capitalize">{{ t }}</mat-option> }
          </mat-select>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
        <table mat-table [dataSource]="datos()" class="w-full min-w-[800px]">
          
          <ng-container matColumnDef="patrimonial">
            <th mat-header-cell *matHeaderCellDef> Cód. Patrimonial </th>
            <td mat-cell *matCellDef="let element" class="font-bold text-ink"> {{element.codigo_patrimonial}} </td>
          </ng-container>

          <ng-container matColumnDef="tipo">
            <th mat-header-cell *matHeaderCellDef> Tipo </th>
            <td mat-cell *matCellDef="let element" class="capitalize"> {{element.tipo}} </td>
          </ng-container>

          <ng-container matColumnDef="marca_modelo">
            <th mat-header-cell *matHeaderCellDef> Marca / Modelo </th>
            <td mat-cell *matCellDef="let element"> {{element.marca}} / {{element.modelo}} </td>
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
              No se encontraron equipos con los filtros actuales.
            </td>
          </tr>
        </table>
      </div>
    </div>
  `
})
export class Equipos implements OnInit {
  equipoService = inject(EquipoService);
  labService = inject(LaboratorioService);
  dialog = inject(MatDialog);
  notify = inject(NotifyService);
  confirm = inject(ConfirmService);

  datos = signal<Equipo[]>([]);
  laboratorios: Laboratorio[] = [];
  tipos = TIPOS_EQUIPO;
  
  labSeleccionado: number | null = null;
  tipoSeleccionado: string | null = null;
  
  columnas = ['patrimonial', 'tipo', 'marca_modelo', 'estado', 'acciones'];

  ngOnInit() {
    this.labService.getAll(false).subscribe(labs => this.laboratorios = labs);
    this.cargar();
  }

  cargar() {
    const peticion = this.labSeleccionado
      ? this.equipoService.getByLaboratorio(this.labSeleccionado, this.tipoSeleccionado || undefined)
      : this.equipoService.getAll();
      
    peticion.subscribe({
      next: (res) => {
        let filtrados = res;
        if (!this.labSeleccionado && this.tipoSeleccionado) {
           filtrados = res.filter(e => e.tipo === this.tipoSeleccionado);
        }
        this.datos.set(filtrados);
      },
      error: (err) => this.notify.error(err)
    });
  }

  abrirDialogo(equipo?: Equipo) {
    const ref = this.dialog.open(EquipoDialog, { data: equipo, disableClose: true, width: '600px' });
    ref.afterClosed().subscribe(cambio => { if (cambio) this.cargar(); });
  }

  eliminar(equipo: Equipo) {
    this.confirm.pedir({
      titulo: 'Eliminar Equipo',
      mensaje: `¿Seguro de eliminar el equipo ${equipo.codigo_patrimonial}?`,
      textoConfirmar: 'Eliminar'
    }).subscribe(ok => {
      if (ok) {
        this.equipoService.delete(equipo.id).subscribe({
          next: () => {
            this.notify.ok('Equipo eliminado');
            this.cargar();
          },
          error: (err) => this.notify.error(err)
        });
      }
    });
  }
}