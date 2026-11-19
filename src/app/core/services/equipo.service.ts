import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { ApiService } from './api.service';
import {
  CategoriaTipoEquipo,
  Equipo,
  EquipoCreate,
  EquipoUpdate,
  Pagina,
  PaginacionParams,
} from '../models/modelos';

export interface EquipoLaboratorioFiltro extends PaginacionParams {
  categoria?: CategoriaTipoEquipo | null;
}

@Injectable({ providedIn: 'root' })
export class EquipoService {
  private api = inject(ApiService);
  private url = '/equipos/';

  getAll(params?: PaginacionParams) {
    return this.api.get<Pagina<Equipo>>(this.url, {
      pagina: params?.pagina ?? 1,
      tamano_pagina: params?.tamano_pagina ?? 10,
    });
  }

  getByLaboratorio(labId: number, params?: EquipoLaboratorioFiltro) {
    return this.api.get<Pagina<Equipo>>(`${this.url}laboratorio/${labId}`, {
      categoria: params?.categoria ?? null,
      pagina: params?.pagina ?? 1,
      tamano_pagina: params?.tamano_pagina ?? 10,
    });
  }

  getByWorkstation(workstationId: number, params?: PaginacionParams) {
    return this.api.get<Pagina<Equipo>>(`${this.url}workstation/${workstationId}`, {
      pagina: params?.pagina ?? 1,
      tamano_pagina: params?.tamano_pagina ?? 10,
    });
  }

  getListadoCompleto() {
    return this.getAll({ pagina: 1, tamano_pagina: 100 }).pipe(map((p) => p.items));
  }

  getById(id: number) {
    return this.api.get<Equipo>(`${this.url}${id}`);
  }

  create(data: EquipoCreate) {
    return this.api.post<Equipo>(this.url, data);
  }

  update(id: number, data: EquipoUpdate) {
    return this.api.put<Equipo>(`${this.url}${id}`, data);
  }

  delete(id: number) {
    return this.api.delete(`${this.url}${id}`);
  }
}