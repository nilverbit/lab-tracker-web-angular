import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';

import { HorarioService } from '../core/services/horario.service';
import { LaboratorioService } from '../core/services/laboratorio.service';
import { NotifyService } from '../core/services/notify.service';
import { ConfirmService } from '../shared/confirm-dialog';
import { StatusChip } from '../shared/status-chip';
import { PageHeader } from '../shared/page-header';
import { HorarioDialog } from './horario-dialog';
import { Horario, Laboratorio } from '../core/models/modelos';

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatSelectModule, MatMenuModule, StatusChip, PageHeader],
  template: `
    <app-page-header titulo="Horarios y Turnos" subtitulo="Control de uso de laboratorios">
      <button mat-flat-button color="primary" (click)="abrirDialogo()">
        <mat-icon>add</mat-icon> Programar Horario
      </button>
    </app-page-header>

    <div class="p-6">
      <div class="mb-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-4">
        <div class="w-72">
          <mat-label class="text-sm font-medium text-muted block mb-1">Laboratorio</mat-label>
          <mat-select [(ngModel)]="labSeleccionado" (selectionChange)="cargar()" class="bg-page px-3 py-2 rounded-md border border-gray-200 w-full">
            <mat-option [value]="null">Todos los laboratorios</mat-option>
            @for (lab of laboratorios; track lab.id) { <mat-option [value]="lab.id">{{ lab.codigo }}</mat-option> }
          </mat-select>
        </div>
        <div class="w-48">
          <mat-label class="text-sm font-medium text-muted block mb-1">Fecha</mat-label>
          <input type="date" [(ngModel)]="fechaSeleccionada" (change)="cargar()" class="bg-page px-3 py-2 rounded-md border border-gray-200 w-full outline-none">
        </div>
        <div class="flex items-end">
           <button mat-button color="warn" (click)="limpiarFiltros()" *ngIf="labSeleccionado || fechaSeleccionada">Limpiar</button>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
        <table mat-table [dataSource]="datos()" class="w-full min-w-[800px]">
          
          <ng-container matColumnDef="turno">
            <th mat-header-cell *matHeaderCellDef> Turno / Docente </th>
            <td mat-cell *matCellDef="let element">
               <div class="font-bold text-ink">{{element.nombre_turno}}</div>
               <div class="text-sm text-muted">{{element.docente_responsable}}</div>
            </td>
          </ng-container>

          <ng-container matColumnDef="fecha">
            <th mat-header-cell *matHeaderCellDef> Fecha / Hora </th>
            <td mat-cell *matCellDef="let element">
               <div>{{element.fecha}}</div>
               <div class="text-sm font-medium text-primary">{{element.hora_inicio}} - {{element.hora_fin}}</div>
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
            <td mat-cell *matCellDef="let element" class="text-right">
              <button mat-icon-button [matMenuTriggerFor]="menu" color="primary">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="cambiarEstado(element.id, 'iniciar')" *ngIf="element.estado === 'programado'">
                  <mat-icon color="primary">play_arrow</mat-icon><span>Iniciar Turno</span>
                </button>
                <button mat-menu-item (click)="cambiarEstado(element.id, 'finalizar')" *ngIf="element.estado === 'en_curso'">
                  <mat-icon color="accent">stop</mat-icon><span>Finalizar Turno</span>
                </button>
                <button mat-menu-item (click)="cambiarEstado(element.id, 'cancelar')" *ngIf="element.estado === 'programado'">
                  <mat-icon color="warn">cancel</mat-icon><span>Cancelar Turno</span>
                </button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columnas"></tr>
          <tr mat-row *matRowDef="let row; columns: columnas;" class="hover:bg-slate-50 transition-colors"></tr>
          <tr class="mat-row" *matNoDataRow>
             <td class="mat-cell text-center py-8 text-muted" [attr.colspan]="columnas.length">No se encontraron horarios.</td>
          </tr>
        </table>
      </div>
    </div>
  `
})
export class Horarios implements OnInit {
  horarioService = inject(HorarioService);
  labService = inject(LaboratorioService);
  dialog = inject(MatDialog);
  notify = inject(NotifyService);
  confirm = inject(ConfirmService);

  datos = signal<Horario[]>([]);
  laboratorios: Laboratorio[] = [];
  labSeleccionado: number | null = null;
  fechaSeleccionada: string = '';
  
  columnas = ['turno', 'fecha', 'estado', 'acciones'];

  ngOnInit() {
    this.labService.getAll().subscribe(labs => this.laboratorios = labs);
    this.cargar();
  }

  limpiarFiltros() {
    this.labSeleccionado = null;
    this.fechaSeleccionada = '';
    this.cargar();
  }

  cargar() {
    this.horarioService.getAll(this.labSeleccionado || undefined, this.fechaSeleccionada || undefined).subscribe({
      next: (res) => this.datos.set(res),
      error: (err) => this.notify.error(err)
    });
  }

  abrirDialogo() {
    const ref = this.dialog.open(HorarioDialog, { disableClose: true });
    ref.afterClosed().subscribe(cambio => { if (cambio) this.cargar(); });
  }

  cambiarEstado(id: number, accion: 'iniciar' | 'finalizar' | 'cancelar') {
    let titulo = accion === 'iniciar' ? 'Iniciar Turno' : (accion === 'finalizar' ? 'Finalizar Turno' : 'Cancelar Turno');
    this.confirm.pedir({ titulo, mensaje: `¿Confirmas que deseas ${accion} este turno?`, textoConfirmar: 'Sí, confirmar' })
    .subscribe(ok => {
      if (ok) {
        this.horarioService[accion](id).subscribe({
          next: () => { this.notify.ok(`Turno actualizado`); this.cargar(); },
          error: (err) => this.notify.error(err)
        });
      }
    });
  }
}