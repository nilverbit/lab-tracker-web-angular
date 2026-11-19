import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../core/services/auth.service';
import { NotifyService } from '../core/services/notify.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <div class="min-h-screen bg-ink flex items-center justify-center p-4 relative overflow-hidden">
      <div
        class="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/20 blur-3xl"></div>
      <div
        class="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl"></div>

      <div class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/10">
        <div class="bg-gradient-to-r from-primary-dark to-primary px-8 py-7 text-white">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
              <mat-icon class="text-white!">science</mat-icon>
            </div>
            <div>
              <h1 class="text-2xl font-bold tracking-wider leading-tight">SIGEMAL</h1>
              <p class="text-xs text-white/85 mt-0.5">
                Sistema de Inventario y Gestión de Laboratorios
              </p>
            </div>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="ingresar()" class="p-8 flex flex-col gap-3">
          <div class="mb-2">
            <h2 class="text-xl font-bold text-ink">Iniciar sesión</h2>
            <p class="text-sm text-muted mt-0.5">Ingresa tus credenciales institucionales</p>
          </div>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Usuario</mat-label>
            <mat-icon matPrefix class="mr-2 text-muted!">person</mat-icon>
            <input
              matInput
              formControlName="username"
              autocomplete="username"
              placeholder="Ej. admin" />
            @if (form.controls.username.hasError('required')) {
              <mat-error>Ingresa tu usuario</mat-error>
            } @else if (form.controls.username.hasError('minlength')) {
              <mat-error>Mínimo 3 caracteres</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Contraseña</mat-label>
            <mat-icon matPrefix class="mr-2 text-muted!">lock</mat-icon>
            <input
              matInput
              [type]="verPassword() ? 'text' : 'password'"
              formControlName="password"
              autocomplete="current-password" />
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="verPassword.set(!verPassword())"
              [attr.aria-label]="verPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
              <mat-icon class="text-muted!">{{ verPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.controls.password.hasError('required')) {
              <mat-error>Ingresa tu contraseña</mat-error>
            }
          </mat-form-field>

          <button
            type="submit"
            [disabled]="form.invalid || cargando()"
            class="w-full mt-2 py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark active:scale-[0.99] text-white font-semibold shadow-md shadow-primary/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            <mat-icon class="text-xl! w-5! h-5!">{{ cargando() ? 'hourglass_top' : 'login' }}</mat-icon>
            <span>{{ cargando() ? 'Verificando acceso...' : 'Ingresar al sistema' }}</span>
          </button>

          <p class="text-center text-xs text-muted mt-4 pt-4 border-t border-slate-100">
            SIGEMAL v2.0 · Acceso controlado por roles
          </p>
        </form>
      </div>
    </div>
  `,
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private notify = inject(NotifyService);
  private router = inject(Router);

  cargando = signal(false);
  verPassword = signal(false);

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required]],
  });

  ingresar() {
    if (this.form.invalid || this.cargando()) return;
    this.cargando.set(true);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.cargando.set(false);
        this.notify.ok(`Bienvenido, ${this.auth.nombreMostrado()}`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.cargando.set(false);
        this.notify.error(err);
      },
    });
  }
}