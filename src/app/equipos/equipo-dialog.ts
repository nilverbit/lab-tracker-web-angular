import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { EquipoService } from '../core/services/equipo.service';
import { LaboratorioService } from '../core/services/laboratorio.service';
import { WorkstationService } from '../core/services/workstation.service';
import { TipoEquipoService } from '../core/services/tipo-equipo.service';
import { NotifyService } from '../core/services/notify.service';
import {
  CATEGORIAS_TIPO_EQUIPO,
  CategoriaTipoEquipo,
  ESTADOS_EQUIPO,
  Equipo,
  EquipoCreate,
  EstadoEquipo,
  Laboratorio,
  MONEDAS,
  Moneda,
  TipoEquipoCatalogo,
  Workstation,
} from '../core/models/modelos';

const PATRON_CODIGO = /^[A-Z0-9\-_]+$/;

@Component({
  selector: 'app-equipo-dialog',
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
          <mat-icon>computer</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-ink leading-tight">
            {{ data ? 'Editar Equipo' : 'Registrar Nuevo Equipo' }}
          </h2>
          <p class="text-xs text-muted">Datos patrimoniales, ubicación y valoración del activo</p>
        </div>
      </div>
      <button mat-icon-button mat-dialog-close type="button" aria-label="Cerrar">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="pt-5! pb-2!">
      <form [formGroup]="form" (ngSubmit)="guardar()" class="flex flex-col gap-4 w-full sm:w-[620px]">
        <!-- Sección 1: Identificación -->
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">
            1. Identificación y Clasificación
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <mat-form-field appearance="outline">
              <mat-label>Código patrimonial</mat-label>
              <input
                matInput
                formControlName="codigo_patrimonial"
                placeholder="Ej. PAT-CPU-001"
                (blur)="normalizarCodigo()" />
              <mat-hint>Mayúsculas, números, guiones o _</mat-hint>
              @if (form.controls.codigo_patrimonial.hasError('required')) {
                <mat-error>Obligatorio</mat-error>
              } @else if (form.controls.codigo_patrimonial.hasError('pattern')) {
                <mat-error>Solo A-Z, 0-9, - y _ (sin espacios)</mat-error>
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

            <mat-form-field appearance="outline">
              <mat-label>Tipo de equipo (Catálogo)</mat-label>
              <mat-select
                formControlName="tipo_equipo_id"
                (selectionChange)="alElegirTipoCatalogo($event.value)">
                <mat-option [value]="null">-- Sin vincular al catálogo --</mat-option>
                @for (t of tiposCatalogo(); track t.id) {
                  <mat-option [value]="t.id">{{ t.codigo }} — {{ t.nombre }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Estado</mat-label>
              <mat-select formControlName="estado">
                @for (e of estados; track e) {
                  <mat-option [value]="e" class="capitalize">{{ e.replaceAll('_', ' ') }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Marca</mat-label>
              <input matInput formControlName="marca" placeholder="Ej. Dell, HP, Lenovo" />
              @if (form.controls.marca.hasError('required')) {
                <mat-error>Obligatorio</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Modelo</mat-label>
              <input matInput formControlName="modelo" placeholder="Ej. OptiPlex 7010" />
              @if (form.controls.modelo.hasError('required')) {
                <mat-error>Obligatorio</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Número de serie (opcional)</mat-label>
              <input matInput formControlName="numero_serie" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Proveedor (opcional)</mat-label>
              <input matInput formControlName="proveedor" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="sm:col-span-2">
              <mat-label>Características técnicas</mat-label>
              <textarea
                matInput
                formControlName="caracteristicas"
                rows="2"
                placeholder="Ej. Intel Core i7, 16GB RAM, SSD 512GB"></textarea>
              @if (form.controls.caracteristicas.hasError('required')) {
                <mat-error>Obligatorio</mat-error>
              }
            </mat-form-field>
          </div>
        </div>

        <!-- Sección 2: Ubicación -->
        <div class="pt-2 border-t border-slate-100">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">
            2. Ubicación Física
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <mat-form-field appearance="outline">
              <mat-label>Laboratorio</mat-label>
              <mat-select
                formControlName="laboratorio_id"
                (selectionChange)="cargarPuestos($event.value, true)">
                @for (lab of laboratorios(); track lab.id) {
                  <mat-option [value]="lab.id">{{ lab.codigo }} — {{ lab.nombre }}</mat-option>
                }
              </mat-select>
              @if (form.controls.laboratorio_id.hasError('required')) {
                <mat-error>Selecciona un laboratorio</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Puesto / Workstation (opcional)</mat-label>
              <mat-select formControlName="workstation_id">
                <mat-option [value]="null">-- Sin asignar a puesto --</mat-option>
                @for (w of puestos(); track w.id) {
                  <mat-option [value]="w.id">{{ w.codigo }} ({{ w.ubicacion_interna }})</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
        </div>

        <!-- Sección 3: Costos y Garantía -->
        <div class="pt-2 border-t border-slate-100">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">
            3. Valoración, Garantía y Adicionales (Opcional)
          </p>
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
              <mat-label>Costo adquisición</mat-label>
              <input matInput type="number" min="0" step="0.01" formControlName="costo_adquisicion" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Costo estimado</mat-label>
              <input matInput type="number" min="0" step="0.01" formControlName="costo_estimado" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Fecha adquisición</mat-label>
              <input matInput type="date" formControlName="fecha_adquisicion" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Garantía hasta</mat-label>
              <input matInput type="date" formControlName="garantia_hasta" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>URL de imagen</mat-label>
              <input matInput formControlName="url_imagen" placeholder="https://..." />
            </mat-form-field>

            <mat-form-field appearance="outline" class="sm:col-span-3">
              <mat-label>Observaciones</mat-label>
              <textarea matInput formControlName="observaciones" rows="2"></textarea>
            </mat-form-field>
          </div>
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
        {{ guardando() ? 'Guardando...' : (data ? 'Guardar cambios' : 'Registrar equipo') }}
      </button>
    </div>
  `,
})
export class EquipoDialog implements OnInit {
  data = inject<Equipo | null>(MAT_DIALOG_DATA, { optional: true });
  private dialogRef = inject(MatDialogRef<EquipoDialog>);
  private fb = inject(FormBuilder);
  private equipoService = inject(EquipoService);
  private labService = inject(LaboratorioService);
  private wsService = inject(WorkstationService);
  private tipoEquipoService = inject(TipoEquipoService);
  private notify = inject(NotifyService);

  categorias = CATEGORIAS_TIPO_EQUIPO;
  estados = ESTADOS_EQUIPO;
  monedas = MONEDAS;

  laboratorios = signal<Laboratorio[]>([]);
  puestos = signal<Workstation[]>([]);
  tiposCatalogo = signal<TipoEquipoCatalogo[]>([]);
  guardando = signal(false);

  form = this.fb.group({
    codigo_patrimonial: [
      this.data?.codigo_patrimonial ?? '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(PATRON_CODIGO),
      ],
    ],
    categoria: [
      (this.data?.categoria ?? 'hardware') as CategoriaTipoEquipo,
      [Validators.required],
    ],
    tipo_equipo_id: [this.data?.tipo_equipo_id ?? null as number | null],
    marca: [
      this.data?.marca ?? '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(60)],
    ],
    modelo: [
      this.data?.modelo ?? '',
      [Validators.required, Validators.minLength(1), Validators.maxLength(80)],
    ],
    numero_serie: [this.data?.numero_serie ?? '', [Validators.maxLength(80)]],
    caracteristicas: [
      this.data?.caracteristicas ?? '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(500)],
    ],
    estado: [(this.data?.estado ?? 'operativo') as EstadoEquipo, [Validators.required]],
    laboratorio_id: [this.data?.laboratorio_id ?? null as number | null, [Validators.required]],
    workstation_id: [this.data?.workstation_id ?? null as number | null],
    moneda: [(this.data?.moneda ?? 'pen') as Moneda],
    costo_adquisicion: [this.data?.costo_adquisicion ?? null as number | null, [Validators.min(0)]],
    costo_estimado: [this.data?.costo_estimado ?? null as number | null, [Validators.min(0)]],
    fecha_adquisicion: [this.data?.fecha_adquisicion ?? ''],
    garantia_hasta: [this.data?.garantia_hasta ?? ''],
    proveedor: [this.data?.proveedor ?? '', [Validators.maxLength(120)]],
    url_imagen: [this.data?.url_imagen ?? '', [Validators.maxLength(500)]],
    observaciones: [this.data?.observaciones ?? '', [Validators.maxLength(500)]],
  });

  ngOnInit() {
    this.labService.getListadoCompleto().subscribe({
      next: (labs) => this.laboratorios.set(labs),
      error: () => {},
    });
    this.tipoEquipoService.getListadoActivos().subscribe({
      next: (tipos) => this.tiposCatalogo.set(tipos),
      error: () => {},
    });
    if (this.data?.laboratorio_id) {
      this.cargarPuestos(this.data.laboratorio_id, false);
    }
  }

  normalizarCodigo() {
    const val = this.form.controls.codigo_patrimonial.value ?? '';
    const limpio = val.trim().toUpperCase().replace(/\s+/g, '-');
    this.form.controls.codigo_patrimonial.setValue(limpio);
  }

  alElegirTipoCatalogo(tipoId: number | null) {
    if (!tipoId) return;
    const encontrado = this.tiposCatalogo().find((t) => t.id === tipoId);
    if (encontrado) {
      this.form.controls.categoria.setValue(encontrado.categoria);
      if (!this.form.controls.costo_estimado.value && encontrado.costo_referencial != null) {
        this.form.controls.costo_estimado.setValue(encontrado.costo_referencial);
        this.form.controls.moneda.setValue(encontrado.moneda);
      }
    }
  }

  cargarPuestos(labId: number | null, limpiarSeleccion: boolean) {
    if (limpiarSeleccion) {
      this.form.controls.workstation_id.setValue(null);
    }
    if (!labId) {
      this.puestos.set([]);
      return;
    }
    this.wsService.getListadoPorLaboratorio(labId).subscribe({
      next: (ws) => this.puestos.set(ws),
      error: () => this.puestos.set([]),
    });
  }

  guardar() {
    this.normalizarCodigo();
    if (this.form.invalid || this.guardando()) return;
    this.guardando.set(true);

    const v = this.form.getRawValue();
    const payload: EquipoCreate = {
      codigo_patrimonial: (v.codigo_patrimonial ?? '').trim().toUpperCase(),
      categoria: v.categoria ?? 'hardware',
      marca: (v.marca ?? '').trim(),
      modelo: (v.modelo ?? '').trim(),
      numero_serie: v.numero_serie?.trim() || null,
      caracteristicas: (v.caracteristicas ?? '').trim(),
      estado: v.estado ?? 'operativo',
      laboratorio_id: Number(v.laboratorio_id),
      workstation_id: v.workstation_id ? Number(v.workstation_id) : null,
      tipo_equipo_id: v.tipo_equipo_id ? Number(v.tipo_equipo_id) : null,
      costo_estimado:
        v.costo_estimado !== null && v.costo_estimado !== ('' as unknown)
          ? Number(v.costo_estimado)
          : null,
      costo_adquisicion:
        v.costo_adquisicion !== null && v.costo_adquisicion !== ('' as unknown)
          ? Number(v.costo_adquisicion)
          : null,
      moneda: v.moneda ?? 'pen',
      fecha_adquisicion: v.fecha_adquisicion || null,
      proveedor: v.proveedor?.trim() || null,
      garantia_hasta: v.garantia_hasta || null,
      observaciones: v.observaciones?.trim() || null,
      url_imagen: v.url_imagen?.trim() || null,
    };

    const peticion = this.data
      ? this.equipoService.update(this.data.id, payload)
      : this.equipoService.create(payload);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.notify.ok(`Equipo ${this.data ? 'actualizado' : 'registrado'} correctamente`);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.guardando.set(false);
        this.notify.error(err);
      },
    });
  }
}