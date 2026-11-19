import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { LicenciaService } from '../core/services/licencia.service';
import { EquipoService } from '../core/services/equipo.service';
import { TipoEquipoService } from '../core/services/tipo-equipo.service';
import { NotifyService } from '../core/services/notify.service';
import {
  ESTADOS_LICENCIA,
  Equipo,
  EstadoLicencia,
  Licencia,
  LicenciaCreate,
  MONEDAS,
  Moneda,
  TIPOS_LICENCIA,
  TipoEquipoCatalogo,
  TipoLicencia,
} from '../core/models/modelos';

const PATRON_CODIGO = /^[A-Z0-9\-_]+$/;

@Component({
  selector: 'app-licencia-dialog',
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
        <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <mat-icon>vpn_key</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-ink leading-tight">
            {{ data ? 'Editar Licencia de Software' : 'Registrar Licencia de Software' }}
          </h2>
          <p class="text-xs text-muted">Control de claves, vigencia, puestos cubiertos y costos</p>
        </div>
      </div>
      <button mat-icon-button mat-dialog-close type="button" aria-label="Cerrar">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="pt-5! pb-2!">
      <form [formGroup]="form" (ngSubmit)="guardar()" class="flex flex-col gap-3 w-full sm:w-[600px]">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <mat-form-field appearance="outline">
            <mat-label>Código interno</mat-label>
            <input
              matInput
              formControlName="codigo"
              placeholder="Ej. LIC-WIN11-001"
              (blur)="normalizarCodigo()" />
            <mat-hint>Mayúsculas, números, guiones o _</mat-hint>
            @if (form.controls.codigo.hasError('required')) {
              <mat-error>Obligatorio</mat-error>
            } @else if (form.controls.codigo.hasError('pattern')) {
              <mat-error>Solo A-Z, 0-9, - y _</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Tipo de licenciamiento</mat-label>
            <mat-select formControlName="tipo">
              @for (t of tipos; track t) {
                <mat-option [value]="t" class="capitalize">{{ t }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <mat-form-field appearance="outline">
            <mat-label>Nombre del software</mat-label>
            <input matInput formControlName="nombre" placeholder="Ej. Windows 11 Pro Education" />
            @if (form.controls.nombre.hasError('required')) {
              <mat-error>Obligatorio</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Fabricante (opcional)</mat-label>
            <input matInput formControlName="fabricante" placeholder="Ej. Microsoft, JetBrains, Autodesk" />
          </mat-form-field>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <mat-form-field appearance="outline" class="sm:col-span-2">
            <mat-label>Clave de producto / Serial (opcional)</mat-label>
            <input
              matInput
              [type]="verClave() ? 'text' : 'password'"
              formControlName="clave_producto"
              placeholder="XXXXX-XXXXX-XXXXX-XXXXX" />
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="verClave.set(!verClave())">
              <mat-icon class="text-muted!">{{ verClave() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Cantidad usuarios</mat-label>
            <input matInput type="number" min="1" formControlName="cantidad_usuarios" />
            @if (form.controls.cantidad_usuarios.hasError('min')) {
              <mat-error>Mínimo 1</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <mat-form-field appearance="outline">
            <mat-label>Equipo asignado (opcional)</mat-label>
            <mat-select formControlName="equipo_id">
              <mat-option [value]="null">-- Licencia general / sin equipo --</mat-option>
              @for (eq of equipos(); track eq.id) {
                <mat-option [value]="eq.id">{{ eq.codigo_patrimonial }} — {{ eq.marca }} {{ eq.modelo }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Tipo de equipo catálogo (opcional)</mat-label>
            <mat-select formControlName="tipo_equipo_id">
              <mat-option [value]="null">-- Ninguno --</mat-option>
              @for (te of tiposEquipo(); track te.id) {
                <mat-option [value]="te.id">{{ te.codigo }} — {{ te.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <mat-form-field appearance="outline">
            <mat-label>Fecha adquisición</mat-label>
            <input matInput type="date" formControlName="fecha_adquisicion" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Fecha vencimiento</mat-label>
            <input matInput type="date" formControlName="fecha_vencimiento" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Estado</mat-label>
            <mat-select formControlName="estado">
              @for (est of estados; track est) {
                <mat-option [value]="est" class="capitalize">{{ est }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <mat-form-field appearance="outline">
            <mat-label>Moneda</mat-label>
            <mat-select formControlName="moneda">
              @for (m of monedas; track m) {
                <mat-option [value]="m">{{ m.toUpperCase() }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Costo (opcional)</mat-label>
            <input matInput type="number" min="0" step="0.01" formControlName="costo" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Observaciones</mat-label>
            <input matInput formControlName="observaciones" />
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>

    <div class="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
      <button mat-button type="button" mat-dialog-close [disabled]="guardando()">Cancelar</button>
      <button
        type="button"
        (click)="guardar()"
        [disabled]="form.invalid || guardando()"
        class="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
        {{ guardando() ? 'Guardando...' : (data ? 'Guardar cambios' : 'Registrar licencia') }}
      </button>
    </div>
  `,
})
export class LicenciaDialog implements OnInit {
  data = inject<Licencia | null>(MAT_DIALOG_DATA, { optional: true });
  private dialogRef = inject(MatDialogRef<LicenciaDialog>);
  private fb = inject(FormBuilder);
  private licenciaService = inject(LicenciaService);
  private equipoService = inject(EquipoService);
  private tipoEquipoService = inject(TipoEquipoService);
  private notify = inject(NotifyService);

  tipos = TIPOS_LICENCIA;
  estados = ESTADOS_LICENCIA;
  monedas = MONEDAS;

  equipos = signal<Equipo[]>([]);
  tiposEquipo = signal<TipoEquipoCatalogo[]>([]);
  guardando = signal(false);
  verClave = signal(false);

  form = this.fb.group({
    codigo: [
      this.data?.codigo ?? '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(PATRON_CODIGO),
      ],
    ],
    nombre: [
      this.data?.nombre ?? '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(120)],
    ],
    tipo: [(this.data?.tipo ?? 'perpetua') as TipoLicencia, [Validators.required]],
    clave_producto: [this.data?.clave_producto ?? '', [Validators.maxLength(120)]],
    fabricante: [this.data?.fabricante ?? '', [Validators.maxLength(100)]],
    cantidad_usuarios: [this.data?.cantidad_usuarios ?? 1, [Validators.required, Validators.min(1)]],
    fecha_adquisicion: [this.data?.fecha_adquisicion ?? ''],
    fecha_vencimiento: [this.data?.fecha_vencimiento ?? ''],
    costo: [this.data?.costo ?? (null as number | null), [Validators.min(0)]],
    moneda: [(this.data?.moneda ?? 'pen') as Moneda],
    estado: [(this.data?.estado ?? 'activa') as EstadoLicencia, [Validators.required]],
    equipo_id: [this.data?.equipo_id ?? (null as number | null)],
    tipo_equipo_id: [this.data?.tipo_equipo_id ?? (null as number | null)],
    observaciones: [this.data?.observaciones ?? '', [Validators.maxLength(500)]],
  });

  ngOnInit() {
    this.equipoService.getListadoCompleto().subscribe({
      next: (eq) => this.equipos.set(eq),
      error: () => {},
    });
    this.tipoEquipoService.getListadoActivos().subscribe({
      next: (tipos) => this.tiposEquipo.set(tipos),
      error: () => {},
    });
  }

  normalizarCodigo() {
    const val = this.form.controls.codigo.value ?? '';
    this.form.controls.codigo.setValue(val.trim().toUpperCase().replace(/\s+/g, '-'));
  }

  guardar() {
    this.normalizarCodigo();
    if (this.form.invalid || this.guardando()) return;
    this.guardando.set(true);

    const v = this.form.getRawValue();
    const payload: LicenciaCreate = {
      codigo: (v.codigo ?? '').trim().toUpperCase(),
      nombre: (v.nombre ?? '').trim(),
      tipo: v.tipo ?? 'perpetua',
      clave_producto: v.clave_producto?.trim() || null,
      fabricante: v.fabricante?.trim() || null,
      cantidad_usuarios: Number(v.cantidad_usuarios ?? 1),
      fecha_adquisicion: v.fecha_adquisicion || null,
      fecha_vencimiento: v.fecha_vencimiento || null,
      costo:
        v.costo !== null && v.costo !== ('' as unknown) ? Number(v.costo) : null,
      moneda: v.moneda ?? 'pen',
      estado: v.estado ?? 'activa',
      equipo_id: v.equipo_id ? Number(v.equipo_id) : null,
      tipo_equipo_id: v.tipo_equipo_id ? Number(v.tipo_equipo_id) : null,
      observaciones: v.observaciones?.trim() || null,
    };

    const peticion = this.data
      ? this.licenciaService.update(this.data.id, payload)
      : this.licenciaService.create(payload);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.notify.ok(`Licencia ${this.data ? 'actualizada' : 'registrada'} correctamente`);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.guardando.set(false);
        this.notify.error(err);
      },
    });
  }
}