import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import {
  Asignacion,
  AsignacionCreate,
  EstadoHorario,
  Horario,
  HorarioCreate,
  Pagina,
  PaginacionParams,
} from '../models/modelos';

export interface HorarioFiltro extends PaginacionParams {
  laboratorio_id?: number | null;
  fecha?: string | null;
  estado?: EstadoHorario | null;
}

@Injectable({ providedIn: 'root' })
export class HorarioService {
  private api = inject(ApiService);
  private url = '/horarios/';

  getAll(params?: HorarioFiltro) {
    return this.api.get<Pagina<Horario>>(this.url, {
      laboratorio_id: params?.laboratorio_id ?? null,
      fecha: params?.fecha ?? null,
      estado: params?.estado ?? null,
      pagina: params?.pagina ?? 1,
      tamano_pagina: params?.tamano_pagina ?? 10,
    });
  }

  getById(id: number) {
    return this.api.get<Horario>(`${this.url}${id}`);
  }

  create(data: HorarioCreate) {
    return this.api.post<Horario>(this.url, data);
  }

  iniciar(id: number) {
    return this.api.patch<Horario>(`${this.url}${id}/iniciar`);
  }

  finalizar(id: number) {
    return this.api.patch<Horario>(`${this.url}${id}/finalizar`);
  }

  cancelar(id: number) {
    return this.api.patch<Horario>(`${this.url}${id}/cancelar`);
  }

  getAsignaciones(horarioId: number, params?: PaginacionParams) {
    return this.api.get<Pagina<Asignacion>>(`${this.url}${horarioId}/asignaciones`, {
      pagina: params?.pagina ?? 1,
      tamano_pagina: params?.tamano_pagina ?? 20,
    });
  }

  asignarWorkstation(horarioId: number, data: AsignacionCreate) {
    return this.api.post<Asignacion>(`${this.url}${horarioId}/asignaciones`, data);
  }

  getHistorialAlumno(codigoAlumno: string, params?: PaginacionParams) {
    return this.api.get<Pagina<Asignacion>>(
      `${this.url}alumnos/${encodeURIComponent(codigoAlumno)}/historial`,
      {
        pagina: params?.pagina ?? 1,
        tamano_pagina: params?.tamano_pagina ?? 10,
      }
    );
  }
}