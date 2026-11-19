import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of, switchMap, tap } from 'rxjs';
import { ApiService } from './api.service';
import { LoginRequest, RolClave, TokenResponse, Usuario } from '../models/modelos';

export const TOKEN_KEY = 'sigemal_token';
const ROL_KEY = 'sigemal_rol';
const USERNAME_KEY = 'sigemal_username';
const USER_KEY = 'sigemal_usuario';
const EXPIRES_KEY = 'sigemal_expires_at';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  private _token = signal<string | null>(this.leerTokenValido());
  private _rol = signal<string>(localStorage.getItem(ROL_KEY) ?? '');
  private _username = signal<string>(localStorage.getItem(USERNAME_KEY) ?? '');
  private _usuario = signal<Usuario | null>(this.leerUsuarioGuardado());

  readonly token = this._token.asReadonly();
  readonly rol = this._rol.asReadonly();
  readonly username = this._username.asReadonly();
  readonly usuario = this._usuario.asReadonly();

  readonly estaAutenticado = computed(() => !!this._token());

  readonly nombreMostrado = computed(() => {
    const u = this._usuario();
    if (u) return `${u.nombres} ${u.apellidos}`.trim();
    return this._username() || 'Usuario';
  });

  readonly rolClave = computed<RolClave | null>(() => {
    const normalizado = this.normalizarTexto(this._rol());
    if (!normalizado) return null;
    if (normalizado.includes('admin')) return 'admin';
    if (
      normalizado.includes('gestion') ||
      normalizado.includes('laboratorio') ||
      normalizado.includes('encargado')
    ) {
      return 'gestion_laboratorios';
    }
    if (normalizado.includes('docente') || normalizado.includes('profesor')) {
      return 'docente';
    }
    return null;
  });

  readonly esAdmin = computed(() => this.rolClave() === 'admin');
  readonly esGestionLabs = computed(() => this.rolClave() === 'gestion_laboratorios');
  readonly esDocente = computed(() => this.rolClave() === 'docente');

  login(credenciales: LoginRequest) {
    return this.api.post<TokenResponse>('/auth/login', credenciales).pipe(
      tap((res) => this.guardarSesion(res)),
      switchMap(() => this.cargarPerfil().pipe(catchError(() => of(null))))
    );
  }

  cargarPerfil() {
    return this.api.get<Usuario>('/auth/me').pipe(
      tap((u) => {
        this._usuario.set(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
      })
    );
  }

  tieneRol(...rolesPermitidos: RolClave[]): boolean {
    const actual = this.rolClave();
    if (!actual) return false;
    return rolesPermitidos.includes(actual);
  }

  cerrarSesion(redirigir = true) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROL_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRES_KEY);

    this._token.set(null);
    this._rol.set('');
    this._username.set('');
    this._usuario.set(null);

    if (redirigir) {
      this.router.navigate(['/login']);
    }
  }

  private guardarSesion(res: TokenResponse) {
    const expiraEn = Date.now() + res.expires_in * 1000;
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(ROL_KEY, res.rol);
    localStorage.setItem(USERNAME_KEY, res.username);
    localStorage.setItem(EXPIRES_KEY, String(expiraEn));

    this._token.set(res.access_token);
    this._rol.set(res.rol);
    this._username.set(res.username);
  }

  private leerTokenValido(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    const expira = Number(localStorage.getItem(EXPIRES_KEY) ?? '0');
    if (!token) return null;
    if (expira && Date.now() > expira) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ROL_KEY);
      localStorage.removeItem(USERNAME_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(EXPIRES_KEY);
      return null;
    }
    return token;
  }

  private leerUsuarioGuardado(): Usuario | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as Usuario) : null;
    } catch {
      return null;
    }
  }

  private normalizarTexto(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}