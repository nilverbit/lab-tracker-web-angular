import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { ApiService } from './api.service';
import {
  Pagina,
  PaginacionParams,
  Rol,
  RolCreate,
  RolUpdate,
} from '../models/modelos';

export interface RolFiltro extends PaginacionParams {
  solo_activos?: boolean;
}

@Injectable({ providedIn: 'root' })
export class RolService {
  private api = inject(ApiService);
  private url = '/roles/';

  getAll(params?: RolFiltro) {
    return this.api.get<Pagina<Rol>>(this.url, {
      solo_activos: params?.solo_activos ?? false,
      pagina: params?.pagina ?? 1,
      tamano_pagina: params?.tamano_pagina ?? 10,
    });
  }

  getListadoCompleto(soloActivos = false) {
    return this.getAll({
      solo_activos: soloActivos,
      pagina: 1,
      tamano_pagina: 100,
    }).pipe(map((p) => p.items));
  }

  getById(id: number) {
    return this.api.get<Rol>(`${this.url}${id}`);
  }

  create(data: RolCreate) {
    return this.api.post<Rol>(this.url, data);
  }

  update(id: number, data: RolUpdate) {
    return this.api.put<Rol>(`${this.url}${id}`, data);
  }

  delete(id: number) {
    return this.api.delete(`${this.url}${id}`);
  }
}