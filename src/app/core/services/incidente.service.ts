import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import {
  Incidente,
  IncidenteCreate,
  IncidenteEstadoUpdate,
  Pagina,
  PaginacionParams,
} from '../models/modelos';

export interface IncidenteFiltro extends PaginacionParams {
  solo_pendientes?: boolean;
}

@Injectable({ providedIn: 'root' })
export class IncidenteService {
  private api = inject(ApiService);
  private url = '/incidentes/';

  getAll(params?: IncidenteFiltro) {
    return this.api.get<Pagina<Incidente>>(this.url, {
      solo_pendientes: params?.solo_pendientes ?? false,
      pagina: params?.pagina ?? 1,
      tamano_pagina: params?.tamano_pagina ?? 10,
    });
  }

  getByEquipo(equipoId: number, params?: PaginacionParams) {
    return this.api.get<Pagina<Incidente>>(`${this.url}equipo/${equipoId}`, {
      pagina: params?.pagina ?? 1,
      tamano_pagina: params?.tamano_pagina ?? 10,
    });
  }

  getByWorkstation(workstationId: number, params?: PaginacionParams) {
    return this.api.get<Pagina<Incidente>>(`${this.url}workstation/${workstationId}`, {
      pagina: params?.pagina ?? 1,
      tamano_pagina: params?.tamano_pagina ?? 10,
    });
  }

  create(data: IncidenteCreate) {
    return this.api.post<Incidente>(this.url, data);
  }

  actualizarEstado(id: number, data: IncidenteEstadoUpdate) {
    return this.api.patch<Incidente>(`${this.url}${id}/estado`, data);
  }
}