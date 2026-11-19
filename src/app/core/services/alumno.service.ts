import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import {
  Alumno,
  AlumnoCreate,
  AlumnoUpdate,
  EstadoAlumno,
  Pagina,
  PaginacionParams,
} from '../models/modelos';

export interface AlumnoFiltro extends PaginacionParams {
  carrera?: string | null;
  estado?: EstadoAlumno | null;
  busqueda?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AlumnoService {
  private api = inject(ApiService);
  private url = '/alumnos/';

  getAll(params?: AlumnoFiltro) {
    return this.api.get<Pagina<Alumno>>(this.url, {
      carrera: params?.carrera?.trim() || null,
      estado: params?.estado ?? null,
      busqueda: params?.busqueda?.trim() || null,
      pagina: params?.pagina ?? 1,
      tamano_pagina: params?.tamano_pagina ?? 10,
    });
  }

  getById(id: number) {
    return this.api.get<Alumno>(`${this.url}${id}`);
  }

  create(data: AlumnoCreate) {
    return this.api.post<Alumno>(this.url, data);
  }

  update(id: number, data: AlumnoUpdate) {
    return this.api.put<Alumno>(`${this.url}${id}`, data);
  }

  delete(id: number) {
    return this.api.delete(`${this.url}${id}`);
  }
}