import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Workstation, WorkstationCreate } from '../models/modelos';

@Injectable({ providedIn: 'root' })
export class WorkstationService {
  private api = inject(ApiService);
  private url = '/workstations/';

  getByLaboratorio(labId: number) { return this.api.get<Workstation[]>(`${this.url}laboratorio/${labId}`); }
  getById(id: number) { return this.api.get<Workstation>(`${this.url}${id}`); }
  create(data: WorkstationCreate) { return this.api.post<Workstation>(this.url, data as any); }
  update(id: number, data: Partial<WorkstationCreate>) { return this.api.put<Workstation>(`${this.url}${id}`, data as any); }
  delete(id: number) { return this.api.delete(`${this.url}${id}`); }
}