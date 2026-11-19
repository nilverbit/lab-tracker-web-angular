import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

import { TipoEquipoService } from '../core/services/tipo-equipo.service';
import { NotifyService } from '../core/services/notify.service';
import {
  CATEGORIAS_TIPO_EQUIPO,
  CategoriaTipoEquipo,
  ESTADOS_TIPO_EQUIPO,
  EstadoTipoEquipo,
  MONEDAS,
  Moneda,
  TipoEquipoCatalogo,
  TipoEquipoCreate,
} from '../core/models/modelos';

const PATRON_CODIGO = /^[A-Z0-9\-_]+$/;

@Component({
  selector: 'app-tipo-equipo-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  template: `
    <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <mat-icon>category</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-ink leading-tight">
            {{ data ? 'Editar Tipo de Equipo' : 'Nuevo Tipo de Equipo' }}
          </h2>
          <p class="text-xs text-muted">Define estándares técnicos y requerimientos del catálogo</p>
        </div>
      </div>
      <button mat-icon-button mat-dialog-close type="button" aria-label="Cerrar">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="pt-5! pb-2!">
      <form [formGroup]="form" (ngSubmit)="guardar()" class="flex flex-col gap-3 w-full sm:w-[560px]">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <mat-form-field appearance="outline">
            <mat-label>Código estándar</mat-label>
            <input
              matInput
              formControlName="codigo"
              placeholder="Ej. TIP-PC-DEV"
              (blur)="normalizarCodigo()" />
            <mat-hint>Mayúsculas, números, guiones o _</mat-hint>
            @if (form.controls.codigo.hasError('required')) {
              <mat-error>Obligatorio</mat-error>
            } @else if (form.controls.codigo.hasError('pattern')) {
              <mat-error>Solo A-Z, 0-9, - y _</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Categoría</mat-label>
            <mat-select formControlName="categoria">
              @for (cat of categorias; track cat) {
                <mat-option [value]="cat" class="capitalize">{{ cat }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Nombre del tipo</mat-label>
          <input matInput formControlName="nombre" placeholder="Ej. Estación de Trabajo Desarrollo" />
          @if (form.controls.nombre.hasError('required')) {
            <mat-error>Obligatorio</mat-error>
          } @else if (form.controls.nombre.hasError('minlength')) {
            <mat-error>Mínimo 2 caracteres</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Descripción</mat-label>
          <textarea
            matInput
            formControlName="descripcion"
            rows="2"
            placeholder="Uso previsto y alcance dentro de los laboratorios"></textarea>
          @if (form.controls.descripcion.hasError('required')) {
            <mat-error>Obligatorio</mat-error>
          } @else if (form.controls.descripcion.hasError('minlength')) {
            <mat-error>Mínimo 2 caracteres</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Especificaciones mínimas (opcional)</mat-label>
          <textarea
            matInput
            formControlName="especificaciones_minimas"
            rows="2"
            placeholder="Ej. Procesador 8 núcleos, 16 GB RAM DDR4, SSD NVMe 512 GB"></textarea>
        </mat-form-field>

        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <mat-form-field appearance="outline">
            <mat-label>Vida útil (meses)</mat-label>
            <input matInput type="number" min="1" max="600" formControlName="vida_util_meses" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Moneda</mat-label>
            <mat-select formControlName="moneda">
              @for (m of monedas; track m) {
                <mat-option [value]="m">{{ m.toUpperCase() }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Costo referencial</mat-label>
            <input matInput type="number" min="0" step="0.01" formControlName="costo_referencial" />
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

        <div class="flex flex-wrap gap-6 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <mat-checkbox formControlName="requiere_mantenimiento" color="primary">
            <span class="text-sm text-ink">Requiere mantenimiento preventivo</span>
          </mat-checkbox>

          <mat-checkbox formControlName="requiere_licencia" color="primary">
            <span class="text-sm text-ink">Requiere licencia de software</span>
          </mat-checkbox>
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
        {{ guardando() ? 'Guardando...' : (data ? 'Guardar cambios' : 'Crear tipo') }}
      </button>
    </div>
  `,
})
export class TipoEquipoDialog {
  data = inject<TipoEquipoCatalogo | null>(MAT_DIALOG_DATA, { optional: true });
  private dialogRef = inject(MatDialogRef<TipoEquipoDialog>);
  private fb = inject(FormBuilder);
  private tipoService = inject(TipoEquipoService);
  private notify = inject(NotifyService);

  categorias = CATEGORIAS_TIPO_EQUIPO;
  estados = ESTADOS_TIPO_EQUIPO;
  monedas = MONEDAS;
  guardando = signal(false);

  form = this.fb.group({
    codigo: [
      this.data?.codigo ?? '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(20),
        Validators.pattern(PATRON_CODIGO),
      ],
    ],
    nombre: [
      this.data?.nombre ?? '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    descripcion: [
      this.data?.descripcion ?? '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(500)],
    ],
    categoria: [(this.data?.categoria ?? 'hardware') as CategoriaTipoEquipo, [Validators.required]],
    especificaciones_minimas: [this.data?.especificaciones_minimas ?? '', [Validators.maxLength(500)]],
    vida_util_meses: [
      this.data?.vida_util_meses ?? (48 as number | null),
      [Validators.min(1), Validators.max(600)],
    ],
    requiere_mantenimiento: [this.data?.requiere_mantenimiento ?? true],
    requiere_licencia: [this.data?.requiere_licencia ?? false],
    costo_referencial: [this.data?.costo_referencial ?? (null as number | null), [Validators.min(0)]],
    moneda: [(this.data?.moneda ?? 'pen') as Moneda],
    estado: [(this.data?.estado ?? 'activo') as EstadoTipoEquipo, [Validators.required]],
  });

  normalizarCodigo() {
    const val = this.form.controls.codigo.value ?? '';
    this.form.controls.codigo.setValue(val.trim().toUpperCase().replace(/\s+/g, '-'));
  }

  guardar() {
    this.normalizarCodigo();
    if (this.form.invalid || this.guardando()) return;
    this.guardando.set(true);

    const v = this.form.getRawValue();
    const payload: TipoEquipoCreate = {
      codigo: (v.codigo ?? '').trim().toUpperCase(),
      nombre: (v.nombre ?? '').trim(),
      descripcion: (v.descripcion ?? '').trim(),
      categoria: v.categoria ?? 'hardware',
      especificaciones_minimas: v.especificaciones_minimas?.trim() || null,
      vida_util_meses:
        v.vida_util_meses !== null && v.vida_util_meses !== ('' as unknown)
          ? Number(v.vida_util_meses)
          : null,
      requiere_mantenimiento: !!v.requiere_mantenimiento,
      requiere_licencia: !!v.requiere_licencia,
      costo_referencial:
        v.costo_referencial !== null && v.costo_referencial !== ('' as unknown)
          ? Number(v.costo_referencial)
          : null,
      moneda: v.moneda ?? 'pen',
      estado: v.estado ?? 'activo',
    };

    const peticion = this.data
      ? this.tipoService.update(this.data.id, payload)
      : this.tipoService.create(payload);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.notify.ok(`Tipo de equipo ${this.data ? 'actualizado' : 'creado'} correctamente`);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.guardando.set(false);
        this.notify.error(err);
      },
    });
  }
}