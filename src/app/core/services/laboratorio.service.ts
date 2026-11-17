import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Laboratorio, LaboratorioCreate } from '../models/modelos';

@Injectable({ providedIn: 'root' })
export class LaboratorioService {
  private api = inject(ApiService);
  private url = '/laboratorios/';

  getAll(soloDisponibles = false) {
    const params = soloDisponibles ? { solo_disponibles: true } : undefined;
    return this.api.get<Laboratorio[]>(this.url, params as any);
  }
  
  getById(id: number) { return this.api.get<Laboratorio>(`${this.url}${id}`); }
  create(data: LaboratorioCreate) { return this.api.post<Laboratorio>(this.url, data); }
  update(id: number, data: Partial<LaboratorioCreate>) { return this.api.put<Laboratorio>(`${this.url}${id}`, data); }
  delete(id: number) { return this.api.delete(`${this.url}${id}`); }
}