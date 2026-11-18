import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Equipo, EquipoCreate } from '../models/modelos';

@Injectable({ providedIn: 'root' })
export class EquipoService {
  private api = inject(ApiService);
  private url = '/equipos/';

  getAll() { return this.api.get<Equipo[]>(this.url); }
  getByLaboratorio(labId: number, tipo?: string) {
    const params = tipo ? { tipo } : undefined;
    return this.api.get<Equipo[]>(`${this.url}laboratorio/${labId}`, params as any);
  }
  getByWorkstation(workstationId: number) { return this.api.get<Equipo[]>(`${this.url}workstation/${workstationId}`); }
  getById(id: number) { return this.api.get<Equipo>(`${this.url}${id}`); }
  create(data: EquipoCreate) { return this.api.post<Equipo>(this.url, data as any); }
  update(id: number, data: Partial<EquipoCreate>) { return this.api.put<Equipo>(`${this.url}${id}`, data as any); }
  delete(id: number) { return this.api.delete(`${this.url}${id}`); }
}