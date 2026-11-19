import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';

import { UsuarioService } from '../core/services/usuario.service';
import { RolService } from '../core/services/rol.service';
import { NotifyService } from '../core/services/notify.service';
import { Rol, Usuario, UsuarioCreate, UsuarioUpdate } from '../core/models/modelos';

const PATRON_USERNAME = /^[A-Za-z0-9\-_]+$/;

@Component({
  selector: 'app-usuario-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule,
  ],
  styles: `
    .clave-oculta {
      -webkit-text-security: disc;
    }
  `,
  template: `
    <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <mat-icon>manage_accounts</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-ink leading-tight">
            {{ data ? 'Editar Usuario' : 'Nuevo Usuario del Sistema' }}
          </h2>
          <p class="text-xs text-muted">Credenciales de acceso y asignación de rol</p>
        </div>
      </div>
      <button mat-icon-button mat-dialog-close type="button" aria-label="Cerrar">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="pt-5! pb-2!">
      <div [formGroup]="form" class="flex flex-col gap-3 w-full sm:w-[540px]">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <mat-form-field appearance="outline">
            <mat-label>Nombre de usuario</mat-label>
            <input
              matInput
              formControlName="username"
              maxlength="50"
              autocomplete="off"
              placeholder="Ej. j.perez" />
            <mat-hint>Letras, números, - o _</mat-hint>
            @if (form.controls.username.hasError('required')) {
              <mat-error>Obligatorio</mat-error>
            } @else if (form.controls.username.hasError('minlength')) {
              <mat-error>Mínimo 3 caracteres</mat-error>
            } @else if (form.controls.username.hasError('pattern')) {
              <mat-error>Sin espacios ni caracteres especiales</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Rol asignado</mat-label>
            <mat-select formControlName="rol_id">
              @for (r of roles(); track r.id) {
                <mat-option [value]="r.id" class="capitalize">
                  {{ r.nombre }} @if (!r.es_activo) { (inactivo) }
                </mat-option>
              }
            </mat-select>
            @if (form.controls.rol_id.hasError('required')) {
              <mat-error>Selecciona un rol</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Nombres</mat-label>
            <input matInput formControlName="nombres" maxlength="100" autocomplete="off" />
            @if (form.controls.nombres.hasError('required')) {
              <mat-error>Obligatorio</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Apellidos</mat-label>
            <input matInput formControlName="apellidos" maxlength="100" autocomplete="off" />
            @if (form.controls.apellidos.hasError('required')) {
              <mat-error>Obligatorio</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Correo electrónico</mat-label>
            <input
              matInput
              type="email"
              formControlName="correo"
              maxlength="150"
              autocomplete="off"
              placeholder="Opcional" />
            @if (form.controls.correo.hasError('email')) {
              <mat-error>Correo inválido</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ data ? 'Nueva contraseña' : 'Contraseña' }}</mat-label>
            <input
              matInput
              type="text"
              [class.clave-oculta]="!verPassword()"
              formControlName="password"
              maxlength="100"
              autocomplete="off"
              spellcheck="false"
              [placeholder]="data ? 'Dejar vacío para no cambiar' : 'Mín. 8 caracteres'" />
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="verPassword.set(!verPassword())"
              [attr.aria-label]="verPassword() ? 'Ocultar' : 'Mostrar'">
              <mat-icon class="text-muted!">{{ verPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-hint>
              {{ data ? 'Opcional · 8 a 100 caracteres' : '8 a 100 caracteres' }}
            </mat-hint>
            <mat-hint align="end">{{ (form.controls.password.value || '').length }}/100</mat-hint>
            @if (form.controls.password.hasError('required')) {
              <mat-error>Obligatoria</mat-error>
            } @else if (form.controls.password.hasError('minlength')) {
              <mat-error>Mínimo 8 caracteres</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="sm:col-span-2">
            <mat-label>URL de avatar / foto (opcional)</mat-label>
            <input matInput formControlName="url_imagen" maxlength="500" placeholder="https://..." />
          </mat-form-field>
        </div>

        <div class="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-ink">Cuenta activa</p>
            <p class="text-xs text-muted">Si se desactiva, el usuario no podrá iniciar sesión</p>
          </div>
          <mat-slide-toggle formControlName="activo" color="primary" />
        </div>
      </div>
    </mat-dialog-content>

    <div class="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
      <button mat-button type="button" mat-dialog-close [disabled]="guardando()">Cancelar</button>
      <button
        type="button"
        (click)="guardar()"
        [disabled]="form.invalid || guardando()"
        class="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
        {{ guardando() ? 'Guardando...' : (data ? 'Guardar cambios' : 'Crear usuario') }}
      </button>
    </div>
  `,
})
export class UsuarioDialog implements OnInit {
  data = inject<Usuario | null>(MAT_DIALOG_DATA, { optional: true });
  private dialogRef = inject(MatDialogRef<UsuarioDialog>);
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private rolService = inject(RolService);
  private notify = inject(NotifyService);

  roles = signal<Rol[]>([]);
  guardando = signal(false);
  verPassword = signal(false);

  form = this.fb.group({
    username: [
      this.data?.username ?? '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern(PATRON_USERNAME),
      ],
    ],
    nombres: [
      this.data?.nombres ?? '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    apellidos: [
      this.data?.apellidos ?? '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    correo: [this.data?.correo ?? '', [Validators.email, Validators.maxLength(150)]],
    url_imagen: [this.data?.url_imagen ?? '', [Validators.maxLength(500)]],
    rol_id: [this.data?.rol_id ?? (null as number | null), [Validators.required]],
    password: [
      '',
      this.data
        ? [Validators.minLength(8), Validators.maxLength(100)]
        : [Validators.required, Validators.minLength(8), Validators.maxLength(100)],
    ],
    activo: [this.data?.activo ?? true],
  });

  ngOnInit() {
    this.rolService.getListadoCompleto(false).subscribe({
      next: (roles) => this.roles.set(roles),
      error: (err) => this.notify.error(err),
    });
  }

  guardar() {
    if (this.form.invalid || this.guardando()) return;
    this.guardando.set(true);

    const v = this.form.getRawValue();

    if (this.data) {
      const payload: UsuarioUpdate = {
        username: (v.username ?? '').trim(),
        nombres: (v.nombres ?? '').trim(),
        apellidos: (v.apellidos ?? '').trim(),
        correo: v.correo?.trim() || null,
        url_imagen: v.url_imagen?.trim() || null,
        rol_id: Number(v.rol_id),
        activo: !!v.activo,
      };
      if (v.password?.trim()) {
        payload.password = v.password.trim();
      }

      this.usuarioService.update(this.data.id, payload).subscribe({
        next: () => {
          this.guardando.set(false);
          this.notify.ok('Usuario actualizado correctamente');
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.guardando.set(false);
          this.notify.error(err);
        },
      });
      return;
    }

    const payload: UsuarioCreate = {
      username: (v.username ?? '').trim(),
      nombres: (v.nombres ?? '').trim(),
      apellidos: (v.apellidos ?? '').trim(),
      correo: v.correo?.trim() || null,
      url_imagen: v.url_imagen?.trim() || null,
      rol_id: Number(v.rol_id),
      activo: !!v.activo,
      password: (v.password ?? '').trim(),
    };

    this.usuarioService.create(payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.notify.ok('Usuario creado correctamente');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.guardando.set(false);
        this.notify.error(err);
      },
    });
  }
}