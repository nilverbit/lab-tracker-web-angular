import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import {
  Pagina,
  PaginacionParams,
  Usuario,
  UsuarioCreate,
  UsuarioUpdate,
} from '../models/modelos';

export interface UsuarioFiltro extends PaginacionParams {
  rol_id?: number | null;
  solo_activos?: boolean;
  busqueda?: string | null;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private api = inject(ApiService);
  private url = '/usuarios/';

  getAll(params?: UsuarioFiltro) {
    return this.api.get<Pagina<Usuario>>(this.url, {
      rol_id: params?.rol_id ?? null,
      solo_activos: params?.solo_activos ?? false,
      busqueda: params?.busqueda?.trim() || null,
      pagina: params?.pagina ?? 1,
      tamano_pagina: params?.tamano_pagina ?? 10,
    });
  }

  getById(id: number) {
    return this.api.get<Usuario>(`${this.url}${id}`);
  }

  create(data: UsuarioCreate) {
    return this.api.post<Usuario>(this.url, data);
  }

  update(id: number, data: UsuarioUpdate) {
    return this.api.put<Usuario>(`${this.url}${id}`, data);
  }

  delete(id: number) {
    return this.api.delete(`${this.url}${id}`);
  }
}