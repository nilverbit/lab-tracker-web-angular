import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { ApiService } from './api.service';
import {
  CategoriaTipoEquipo,
  Pagina,
  PaginacionParams,
  TipoEquipoCatalogo,
  TipoEquipoCreate,
  TipoEquipoUpdate,
} from '../models/modelos';

export interface TipoEquipoFiltro extends PaginacionParams {
  solo_activos?: boolean;
  categoria?: CategoriaTipoEquipo | null;
}

@Injectable({ providedIn: 'root' })
export class TipoEquipoService {
  private api = inject(ApiService);
  private url = '/tipos-equipo/';

  getAll(params?: TipoEquipoFiltro) {
    return this.api.get<Pagina<TipoEquipoCatalogo>>(this.url, {
      solo_activos: params?.solo_activos ?? false,
      categoria: params?.categoria ?? null,
      pagina: params?.pagina ?? 1,
      tamano_pagina: params?.tamano_pagina ?? 10,
    });
  }

  getListadoActivos() {
    return this.getAll({ solo_activos: true, pagina: 1, tamano_pagina: 100 }).pipe(
      map((p) => p.items)
    );
  }

  getById(id: number) {
    return this.api.get<TipoEquipoCatalogo>(`${this.url}${id}`);
  }

  create(data: TipoEquipoCreate) {
    return this.api.post<TipoEquipoCatalogo>(this.url, data);
  }

  update(id: number, data: TipoEquipoUpdate) {
    return this.api.put<TipoEquipoCatalogo>(`${this.url}${id}`, data);
  }

  delete(id: number) {
    return this.api.delete(`${this.url}${id}`);
  }
}