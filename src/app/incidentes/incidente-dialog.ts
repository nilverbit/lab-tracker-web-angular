import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { IncidenteService } from '../core/services/incidente.service';
import { EquipoService } from '../core/services/equipo.service';
import { LaboratorioService } from '../core/services/laboratorio.service';
import { WorkstationService } from '../core/services/workstation.service';
import { AuthService } from '../core/services/auth.service';
import { NotifyService } from '../core/services/notify.service';
import {
  ESTADOS_INCIDENTE,
  Equipo,
  EstadoIncidente,
  Incidente,
  Laboratorio,
  PRIORIDADES,
  PrioridadIncidente,
  Workstation,
} from '../core/models/modelos';

@Component({
  selector: 'app-incidente-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  template: `
    <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-amber-100 text-warn flex items-center justify-center">
          <mat-icon>report_problem</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-ink leading-tight">
            {{ data ? 'Actualizar Estado del Incidente' : 'Reportar Incidente' }}
          </h2>
          <p class="text-xs text-muted">
            {{ data ? 'Incidente #' + data.id + ' · ' + data.reportado_por : 'Registra una falla o solicitud de soporte técnico' }}
          </p>
        </div>
      </div>
      <button mat-icon-button mat-dialog-close type="button" aria-label="Cerrar">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="pt-5! pb-2!">
      @if (!data) {
        <!-- Formulario CREAR (POST /incidentes/) -->
        <form [formGroup]="formCrear" (ngSubmit)="guardar()" class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:w-[520px]">
          <mat-form-field appearance="outline">
            <mat-label>Reportado por</mat-label>
            <input matInput formControlName="reportado_por" placeholder="Nombre de quien reporta" />
            @if (formCrear.controls.reportado_por.hasError('required')) {
              <mat-error>Obligatorio</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Prioridad</mat-label>
            <mat-select formControlName="prioridad">
              @for (p of prioridades; track p) {
                <mat-option [value]="p" class="capitalize">{{ p }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Laboratorio (para filtrar puesto)</mat-label>
            <mat-select (selectionChange)="cargarPuestos($event.value)">
              <mat-option [value]="null">-- Ninguno --</mat-option>
              @for (lab of laboratorios(); track lab.id) {
                <mat-option [value]="lab.id">{{ lab.codigo }} — {{ lab.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Puesto afectado (opcional)</mat-label>
            <mat-select formControlName="workstation_id">
              <mat-option [value]="null">-- Sin puesto --</mat-option>
              @for (w of puestos(); track w.id) {
                <mat-option [value]="w.id">{{ w.codigo }} ({{ w.ubicacion_interna }})</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="sm:col-span-2">
            <mat-label>Equipo afectado (opcional)</mat-label>
            <mat-select formControlName="equipo_id">
              <mat-option [value]="null">-- Sin equipo específico --</mat-option>
              @for (eq of equipos(); track eq.id) {
                <mat-option [value]="eq.id">
                  {{ eq.codigo_patrimonial }} — {{ eq.marca }} {{ eq.modelo }} ({{ eq.categoria }})
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="sm:col-span-2">
            <mat-label>Descripción del problema</mat-label>
            <textarea
              matInput
              formControlName="descripcion"
              rows="3"
              placeholder="Describe la falla detectada con el mayor detalle posible"></textarea>
            @if (formCrear.controls.descripcion.hasError('required')) {
              <mat-error>Obligatorio</mat-error>
            } @else if (formCrear.controls.descripcion.hasError('minlength')) {
              <mat-error>Mínimo 5 caracteres</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="sm:col-span-2">
            <mat-label>URLs de imágenes de evidencia (opcional, una por línea)</mat-label>
            <textarea
              matInput
              formControlName="imagenes_texto"
              rows="2"
              placeholder="https://ejemplo.com/evidencia-1.jpg"></textarea>
          </mat-form-field>
        </form>
      } @else {
        <!-- Formulario ACTUALIZAR ESTADO (PATCH /incidentes/{id}/estado) -->
        <form [formGroup]="formEstado" (ngSubmit)="guardar()" class="flex flex-col gap-3 w-full sm:w-[460px]">
          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-ink">
            <p class="text-xs font-semibold uppercase tracking-wider text-muted mb-1">Descripción reportada</p>
            <p>{{ data.descripcion }}</p>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Nuevo estado de atención</mat-label>
            <mat-select formControlName="estado">
              @for (e of estados; track e) {
                <mat-option [value]="e" class="capitalize">{{ e.replaceAll('_', ' ') }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>URLs de evidencias (una por línea)</mat-label>
            <textarea
              matInput
              formControlName="imagenes_texto"
              rows="3"
              placeholder="https://ejemplo.com/solucion.jpg"></textarea>
          </mat-form-field>
        </form>
      }
    </mat-dialog-content>

    <div class="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
      <button mat-button type="button" mat-dialog-close [disabled]="guardando()">Cancelar</button>
      <button
        type="button"
        (click)="guardar()"
        [disabled]="(data ? formEstado.invalid : formCrear.invalid) || guardando()"
        class="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
        {{ guardando() ? 'Guardando...' : (data ? 'Actualizar estado' : 'Registrar incidente') }}
      </button>
    </div>
  `,
})
export class IncidenteDialog implements OnInit {
  data = inject<Incidente | null>(MAT_DIALOG_DATA, { optional: true });
  private dialogRef = inject(MatDialogRef<IncidenteDialog>);
  private fb = inject(FormBuilder);
  private incidenteService = inject(IncidenteService);
  private equipoService = inject(EquipoService);
  private labService = inject(LaboratorioService);
  private wsService = inject(WorkstationService);
  private auth = inject(AuthService);
  private notify = inject(NotifyService);

  prioridades = PRIORIDADES;
  estados = ESTADOS_INCIDENTE;

  laboratorios = signal<Laboratorio[]>([]);
  puestos = signal<Workstation[]>([]);
  equipos = signal<Equipo[]>([]);
  guardando = signal(false);

  formCrear = this.fb.group({
    reportado_por: [
      this.auth.nombreMostrado(),
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    descripcion: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
    prioridad: ['media' as PrioridadIncidente, [Validators.required]],
    workstation_id: [null as number | null],
    equipo_id: [null as number | null],
    imagenes_texto: [''],
  });

  formEstado = this.fb.nonNullable.group({
    estado: [(this.data?.estado ?? 'en_proceso') as EstadoIncidente, [Validators.required]],
    imagenes_texto: [(this.data?.url_imagenes ?? []).join('\n')],
  });

  ngOnInit() {
    if (!this.data) {
      this.labService.getListadoCompleto().subscribe({
        next: (labs) => this.laboratorios.set(labs),
        error: () => {},
      });
      this.equipoService.getListadoCompleto().subscribe({
        next: (eq) => this.equipos.set(eq),
        error: () => {},
      });
    }
  }

  cargarPuestos(labId: number | null) {
    this.formCrear.controls.workstation_id.setValue(null);
    if (!labId) {
      this.puestos.set([]);
      return;
    }
    this.wsService.getListadoPorLaboratorio(labId).subscribe({
      next: (ws) => this.puestos.set(ws),
      error: () => this.puestos.set([]),
    });
  }

  private parsearImagenes(texto: string | null | undefined): string[] | null {
    const urls = (texto ?? '')
      .split(/[\n,]/)
      .map((u) => u.trim())
      .filter(Boolean);
    return urls.length > 0 ? urls : null;
  }

  guardar() {
    if (this.guardando()) return;

    if (this.data) {
      if (this.formEstado.invalid) return;
      this.guardando.set(true);
      const v = this.formEstado.getRawValue();
      this.incidenteService
        .actualizarEstado(this.data.id, {
          estado: v.estado,
          url_imagenes: this.parsearImagenes(v.imagenes_texto),
        })
        .subscribe({
          next: () => {
            this.guardando.set(false);
            this.notify.ok('Estado del incidente actualizado');
            this.dialogRef.close(true);
          },
          error: (err) => {
            this.guardando.set(false);
            this.notify.error(err);
          },
        });
      return;
    }

    if (this.formCrear.invalid) return;
    this.guardando.set(true);
    const v = this.formCrear.getRawValue();
    this.incidenteService
      .create({
        reportado_por: (v.reportado_por ?? '').trim(),
        descripcion: (v.descripcion ?? '').trim(),
        prioridad: v.prioridad ?? 'media',
        workstation_id: v.workstation_id ? Number(v.workstation_id) : null,
        equipo_id: v.equipo_id ? Number(v.equipo_id) : null,
        url_imagenes: this.parsearImagenes(v.imagenes_texto),
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.notify.ok('Incidente reportado correctamente');
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.guardando.set(false);
          this.notify.error(err);
        },
      });
  }
}