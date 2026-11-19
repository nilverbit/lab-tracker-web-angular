import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { ApiService } from './api.service';
import {
  Pagina,
  PaginacionParams,
  Workstation,
  WorkstationCreate,
  WorkstationUpdate,
} from '../models/modelos';

@Injectable({ providedIn: 'root' })
export class WorkstationService {
  private api = inject(ApiService);
  private url = '/workstations/';

  getByLaboratorio(labId: number, params?: PaginacionParams) {
    return this.api.get<Pagina<Workstation>>(`${this.url}laboratorio/${labId}`, {
      pagina: params?.pagina ?? 1,
      tamano_pagina: params?.tamano_pagina ?? 10,
    });
  }

  getListadoPorLaboratorio(labId: number) {
    return this.getByLaboratorio(labId, { pagina: 1, tamano_pagina: 100 }).pipe(
      map((p) => p.items)
    );
  }

  getById(id: number) {
    return this.api.get<Workstation>(`${this.url}${id}`);
  }

  create(data: WorkstationCreate) {
    return this.api.post<Workstation>(this.url, data);
  }

  update(id: number, data: WorkstationUpdate) {
    return this.api.put<Workstation>(`${this.url}${id}`, data);
  }

  delete(id: number) {
    return this.api.delete(`${this.url}${id}`);
  }
}