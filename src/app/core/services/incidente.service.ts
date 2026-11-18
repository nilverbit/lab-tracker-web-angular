import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Incidente, IncidenteCreate } from '../models/modelos';

@Injectable({ providedIn: 'root' })
export class IncidenteService {
  private api = inject(ApiService);
  private url = '/incidentes/';

  getAll() { return this.api.get<Incidente[]>(this.url); }
  getById(id: number) { return this.api.get<Incidente>(`${this.url}${id}`); }
  create(data: IncidenteCreate) { return this.api.post<Incidente>(this.url, data as any); }
  update(id: number, data: Partial<IncidenteCreate>) { return this.api.put<Incidente>(`${this.url}${id}`, data as any); }
  resolver(id: number) { return this.api.patch<Incidente>(`${this.url}${id}/resolver`); }
  delete(id: number) { return this.api.delete(`${this.url}${id}`); }
}