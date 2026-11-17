import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class NotifyService {
  private snack = inject(MatSnackBar);

  ok(mensaje: string) {
    this.snack.open(mensaje, 'OK', { duration: 3000 });
  }

  // Convierte el error del backend (FastAPI) en un texto legible
  error(err: unknown) {
    this.snack.open(this.leer(err), 'Cerrar', { duration: 6000 });
  }

  private leer(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) return 'No hay conexión con el servidor.';
      const d = err.error?.detail;
      if (typeof d === 'string') return d;
      if (Array.isArray(d)) return d.map((x: { msg?: string }) => x.msg).join(' | ');
    }
    return 'Ocurrió un error inesperado.';
  }
}