import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotifyService } from '../services/notify.service';
import { RolClave } from '../models/modelos';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.estaAutenticado() ? true : router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.estaAutenticado() ? router.createUrlTree(['/dashboard']) : true;
};

export const roleGuard = (...rolesPermitidos: RolClave[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const notify = inject(NotifyService);

    if (!auth.estaAutenticado()) {
      return router.createUrlTree(['/login']);
    }
    if (auth.tieneRol(...rolesPermitidos)) {
      return true;
    }

    notify.aviso('No tienes permisos para entrar a esta sección.');
    return router.createUrlTree(['/dashboard']);
  };
};