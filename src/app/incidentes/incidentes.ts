import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { IncidenteService } from '../core/services/incidente.service';
import { NotifyService } from '../core/services/notify.service';
import { ConfirmService } from '../shared/confirm-dialog';
import { StatusChip } from '../shared/status-chip';
import { PageHeader } from '../shared/page-header';
import { IncidenteDialog } from './incidente-dialog';
import { Incidente } from '../core/models/modelos';

@Component({
  selector: 'app-incidentes',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatTooltipModule, StatusChip, PageHeader],
  template: `
    <app-page-header titulo="Registro de Incidentes" subtitulo="Reporte y seguimiento de problemas">
      <button mat-flat-button color="warn" (click)="abrirDialogo()">
        <mat-icon>warning</mat-icon> Reportar Incidente
      </button>
    </app-page-header>

    <div class="p-6">
      <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table mat-table [dataSource]="datos()" class="w-full">
          
          <ng-container matColumnDef="fecha">
            <th mat-header-cell *matHeaderCellDef> Fecha </th>
            <td mat-cell *matCellDef="let element" class="whitespace-nowrap"> 
               {{ element.fecha_reporte | date:'short' }} 
            </td>
          </ng-container>

          <ng-container matColumnDef="incidente">
            <th mat-header-cell *matHeaderCellDef> Reportado por </th>
            <td mat-cell *matCellDef="let element">
               <div class="font-bold text-ink">{{element.reportado_por}}</div>
               <div class="text-sm text-muted truncate max-w-xs" [matTooltip]="element.descripcion">{{element.descripcion}}</div>
            </td>
          </ng-container>

          <ng-container matColumnDef="prioridad">
            <th mat-header-cell *matHeaderCellDef> Prioridad </th>
            <td mat-cell *matCellDef="let element">
               <span class="px-2 py-1 rounded text-xs font-bold uppercase"
                     [ngClass]="{
                       'bg-red-100 text-red-700': element.prioridad === 'alta' || element.prioridad === 'critica',
                       'bg-orange-100 text-orange-700': element.prioridad === 'media',
                       'bg-blue-100 text-blue-700': element.prioridad === 'baja'
                     }">
                  {{element.prioridad}}
               </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef> Estado </th>
            <td mat-cell *matCellDef="let element">
              <app-status-chip [valor]="element.estado" />
            </td>
          </ng-container>

          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef class="text-right"> Acciones </th>
            <td mat-cell *matCellDef="let element" class="text-right whitespace-nowrap">
              <button mat-icon-button color="primary" matTooltip="Editar" (click)="abrirDialogo(element)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="accent" matTooltip="Marcar como Resuelto" (click)="resolver(element)" *ngIf="element.estado !== 'resuelto'">
                <mat-icon>check_circle</mat-icon>
              </button>
              <button mat-icon-button color="warn" matTooltip="Eliminar" (click)="eliminar(element)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columnas"></tr>
          <tr mat-row *matRowDef="let row; columns: columnas;" class="hover:bg-slate-50 transition-colors"></tr>
          <tr class="mat-row" *matNoDataRow>
             <td class="mat-cell text-center py-8 text-muted" [attr.colspan]="columnas.length">No hay incidentes.</td>
          </tr>
        </table>
      </div>
    </div>
  `
})
export class Incidentes implements OnInit {
  incidenteService = inject(IncidenteService);
  dialog = inject(MatDialog);
  notify = inject(NotifyService);
  confirm = inject(ConfirmService);

  datos = signal<Incidente[]>([]);
  columnas = ['fecha', 'incidente', 'prioridad', 'estado', 'acciones'];

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.incidenteService.getAll().subscribe({
      next: (res: any) => this.datos.set(res),
      error: (err: any) => this.notify.error(err)
    });
  }

  abrirDialogo(incidente?: Incidente) {
    const ref = this.dialog.open(IncidenteDialog, { data: incidente, disableClose: true, width: '600px' });
    ref.afterClosed().subscribe(cambio => { if (cambio) this.cargar(); });
  }

  resolver(incidente: Incidente) {
    this.confirm.pedir({
      titulo: 'Resolver Incidente',
      mensaje: `¿Marcar este incidente como resuelto?`,
      textoConfirmar: 'Sí, resolver'
    }).subscribe(ok => {
      if (ok) {
        this.incidenteService.resolver(incidente.id).subscribe({
          next: () => { this.notify.ok('Incidente resuelto'); this.cargar(); },
          error: (err: any) => this.notify.error(err)
        });
      }
    });
  }

  eliminar(incidente: Incidente) {
    this.confirm.pedir({
      titulo: 'Eliminar Registro',
      mensaje: `¿Seguro de eliminar este incidente?`,
      textoConfirmar: 'Eliminar'
    }).subscribe(ok => {
      if (ok) {
        this.incidenteService.delete(incidente.id).subscribe({
          next: () => { this.notify.ok('Incidente eliminado'); this.cargar(); },
          error: (err: any) => this.notify.error(err)
        });
      }
    });
  }
}