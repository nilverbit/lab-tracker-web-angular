import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { ApiService } from './api.service';
import {
  Laboratorio,
  LaboratorioCreate,
  LaboratorioUpdate,
  Pagina,
  PaginacionParams,
} from '../models/modelos';

export interface LaboratorioFiltro extends PaginacionParams {
  solo_disponibles?: boolean;
}

@Injectable({ providedIn: 'root' })
export class LaboratorioService {
  private api = inject(ApiService);
  private url = '/laboratorios/';

  getAll(params?: LaboratorioFiltro) {
    return this.api.get<Pagina<Laboratorio>>(this.url, {
      solo_disponibles: params?.solo_disponibles ?? false,
      pagina: params?.pagina ?? 1,
      tamano_pagina: params?.tamano_pagina ?? 10,
    });
  }

  getListadoCompleto(soloDisponibles = false) {
    return this.getAll({
      solo_disponibles: soloDisponibles,
      pagina: 1,
      tamano_pagina: 100,
    }).pipe(map((p) => p.items));
  }

  getById(id: number) {
    return this.api.get<Laboratorio>(`${this.url}${id}`);
  }

  create(data: LaboratorioCreate) {
    return this.api.post<Laboratorio>(this.url, data);
  }

  update(id: number, data: LaboratorioUpdate) {
    return this.api.put<Laboratorio>(`${this.url}${id}`, data);
  }

  delete(id: number) {
    return this.api.delete(`${this.url}${id}`);
  }
}