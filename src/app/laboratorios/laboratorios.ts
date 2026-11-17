import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LaboratorioService } from '../core/services/laboratorio.service';
import { NotifyService } from '../core/services/notify.service';
import { ConfirmService } from '../shared/confirm-dialog';
import { StatusChip } from '../shared/status-chip';
import { PageHeader } from '../shared/page-header';
import { LaboratorioDialog } from './laboratorio-dialog';
import { Laboratorio } from '../core/models/modelos';

@Component({
  selector: 'app-laboratorios',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatSlideToggleModule, MatTooltipModule, StatusChip, PageHeader],
  template: `
    <app-page-header titulo="Laboratorios" subtitulo="Gestión de laboratorios de cómputo y aulas">
      <button mat-flat-button color="primary" (click)="abrirDialogo()">
        <mat-icon>add</mat-icon> Nuevo Laboratorio
      </button>
    </app-page-header>

    <div class="p-6">
      <div class="mb-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
        <mat-slide-toggle [(ngModel)]="soloDisponibles" (change)="cargar()" color="primary">
          Mostrar solo disponibles
        </mat-slide-toggle>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table mat-table [dataSource]="datos()" class="w-full">
          
          <ng-container matColumnDef="codigo">
            <th mat-header-cell *matHeaderCellDef> Código </th>
            <td mat-cell *matCellDef="let element" class="font-bold text-ink"> {{element.codigo}} </td>
          </ng-container>

          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef> Nombre </th>
            <td mat-cell *matCellDef="let element"> {{element.nombre}} </td>
          </ng-container>

          <ng-container matColumnDef="ubicacion">
            <th mat-header-cell *matHeaderCellDef> Ubicación </th>
            <td mat-cell *matCellDef="let element" class="text-muted"> {{element.ubicacion}} </td>
          </ng-container>

          <ng-container matColumnDef="capacidad">
            <th mat-header-cell *matHeaderCellDef> Capacidad </th>
            <td mat-cell *matCellDef="let element"> {{element.capacidad_workstations}} Puestos </td>
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
              No se encontraron laboratorios registrados.
            </td>
          </tr>
        </table>
      </div>
    </div>
  `
})
export class Laboratorios implements OnInit {
  labService = inject(LaboratorioService);
  dialog = inject(MatDialog);
  notify = inject(NotifyService);
  confirm = inject(ConfirmService);

  datos = signal<Laboratorio[]>([]);
  soloDisponibles = false;
  columnas = ['codigo', 'nombre', 'ubicacion', 'capacidad', 'estado', 'acciones'];

  ngOnInit() { this.cargar(); }

  cargar() {
    this.labService.getAll(this.soloDisponibles).subscribe({
      next: (res) => this.datos.set(res),
      error: (err) => this.notify.error(err)
    });
  }

  abrirDialogo(lab?: Laboratorio) {
    const ref = this.dialog.open(LaboratorioDialog, { data: lab, disableClose: true });
    ref.afterClosed().subscribe(cambio => {
      if (cambio) this.cargar(); // Recarga la tabla si se guardó algo
    });
  }

  eliminar(lab: Laboratorio) {
    this.confirm.pedir({
      titulo: 'Eliminar Laboratorio',
      mensaje: `¿Estás seguro de eliminar el laboratorio ${lab.codigo}? Esta acción borrará en cascada todos sus puestos, equipos y horarios asociados. NO se puede deshacer.`,
      textoConfirmar: 'Eliminar'
    }).subscribe(ok => {
      if (ok) {
        this.labService.delete(lab.id).subscribe({
          next: () => {
            this.notify.ok('Laboratorio eliminado correctamente');
            this.cargar();
          },
          error: (err) => this.notify.error(err)
        });
      }
    });
  }
}