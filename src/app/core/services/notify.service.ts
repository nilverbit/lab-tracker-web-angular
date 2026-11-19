import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { DetalleError } from '../models/modelos';

@Injectable({ providedIn: 'root' })
export class NotifyService {
  private snack = inject(MatSnackBar);

  ok(mensaje: string) {
    this.snack.open(mensaje, 'OK', { duration: 3000 });
  }

  aviso(mensaje: string) {
    this.snack.open(mensaje, 'Entendido', { duration: 4500 });
  }

  error(err: unknown) {
    this.snack.open(this.leer(err), 'Cerrar', { duration: 6000 });
  }

  private leer(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) return 'No hay conexión con el servidor.';
      if (err.status === 429) return 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.';

      const body = err.error;

      // Formato nuevo ApiResponse (errors[] y message)
      if (Array.isArray(body?.errors) && body.errors.length > 0) {
        return body.errors
          .map((e: DetalleError) => (e.campo ? `${e.campo}: ${e.mensaje}` : e.mensaje))
          .join(' | ');
      }
      if (typeof body?.message === 'string' && body.message.trim()) {
        return body.message;
      }

      // Formato estándar FastAPI (HTTPValidationError 422)
      const detail = body?.detail;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        return detail
          .map((x: { loc?: (string | number)[]; msg?: string }) => {
            const campo = x.loc?.length ? x.loc[x.loc.length - 1] : '';
            return campo ? `${campo}: ${x.msg}` : x.msg;
          })
          .filter(Boolean)
          .join(' | ');
      }

      if (err.status === 401) return 'Credenciales inválidas o sesión expirada.';
      if (err.status === 403) return 'No tienes permisos para realizar esta acción.';
    }
    return 'Ocurrió un error inesperado.';
  }
}