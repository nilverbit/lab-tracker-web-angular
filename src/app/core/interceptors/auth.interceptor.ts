import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService, TOKEN_KEY } from '../services/auth.service';
import { NotifyService } from '../services/notify.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  const token = localStorage.getItem(TOKEN_KEY);
  const esLogin = req.url.includes('/auth/login');

  const peticion =
    token && !esLogin
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(peticion).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401 && !esLogin) {
          const auth = injector.get(AuthService);
          const notify = injector.get(NotifyService);
          if (auth.estaAutenticado()) {
            notify.aviso('Tu sesión expiró. Vuelve a iniciar sesión.');
            auth.cerrarSesion(true);
          }
        } else if (err.status === 403) {
          injector.get(NotifyService).aviso('No tienes permisos para acceder a este recurso.');
        }
      }
      return throwError(() => err);
    })
  );
};