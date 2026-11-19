import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import {
  ColumnaPlantilla,
  Matricula,
  Pagina,
  PaginacionParams,
  ResultadoCargaMatricula,
} from '../models/modelos';

@Injectable({ providedIn: 'root' })
export class MatriculaService {
  private api = inject(ApiService);
  private url = '/matriculas';

  getPlantilla() {
    return this.api.get<ColumnaPlantilla[]>(`${this.url}/plantilla`);
  }

  getPorHorario(horarioId: number, params?: PaginacionParams) {
    return this.api.get<Pagina<Matricula>>(`${this.url}/horario/${horarioId}`, {
      pagina: params?.pagina ?? 1,
      tamano_pagina: params?.tamano_pagina ?? 10,
    });
  }

  cargarExcel(horarioId: number, archivo: File, permitirParciales = false) {
    const formData = new FormData();
    formData.append('horario_id', String(horarioId));
    formData.append('permitir_parciales', String(permitirParciales));
    formData.append('archivo', archivo, archivo.name);
    return this.api.postForm<ResultadoCargaMatricula>(`${this.url}/carga-excel`, formData);
  }

  delete(matriculaId: number) {
    return this.api.delete(`${this.url}/${matriculaId}`);
  }
}