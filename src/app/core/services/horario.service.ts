import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Horario, HorarioCreate } from '../models/modelos';

@Injectable({ providedIn: 'root' })
export class HorarioService {
  private api = inject(ApiService);
  private url = '/horarios/';

  getAll(laboratorioId?: number, fecha?: string) {
    let params: any = {};
    if (laboratorioId) params.laboratorio_id = laboratorioId;
    if (fecha) params.fecha = fecha;
    return this.api.get<Horario[]>(this.url, Object.keys(params).length ? params : undefined);
  }

  getById(id: number) { return this.api.get<Horario>(`${this.url}${id}`); }
  create(data: HorarioCreate) { return this.api.post<Horario>(this.url, data as any); }
  
  iniciar(id: number) { return this.api.patch<Horario>(`${this.url}${id}/iniciar`); }
  finalizar(id: number) { return this.api.patch<Horario>(`${this.url}${id}/finalizar`); }
  cancelar(id: number) { return this.api.patch<Horario>(`${this.url}${id}/cancelar`); }
}