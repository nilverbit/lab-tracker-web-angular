import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import {
  EstadoLicencia,
  Licencia,
  LicenciaCreate,
  LicenciaUpdate,
  Pagina,
  PaginacionParams,
} from '../models/modelos';

export interface LicenciaFiltro extends PaginacionParams {
  equipo_id?: number | null;
  estado?: EstadoLicencia | null;
}

@Injectable({ providedIn: 'root' })
export class LicenciaService {
  private api = inject(ApiService);
  private url = '/licencias/';

  getAll(params?: LicenciaFiltro) {
    return this.api.get<Pagina<Licencia>>(this.url, {
      equipo_id: params?.equipo_id ?? null,
      estado: params?.estado ?? null,
      pagina: params?.pagina ?? 1,
      tamano_pagina: params?.tamano_pagina ?? 10,
    });
  }

  getById(id: number) {
    return this.api.get<Licencia>(`${this.url}${id}`);
  }

  create(data: LicenciaCreate) {
    return this.api.post<Licencia>(this.url, data);
  }

  update(id: number, data: LicenciaUpdate) {
    return this.api.put<Licencia>(`${this.url}${id}`, data);
  }

  delete(id: number) {
    return this.api.delete(`${this.url}${id}`);
  }
}