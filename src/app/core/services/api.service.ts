import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { ApiResponse } from '../models/modelos';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = '/api';

  get<T>(url: string, params?: QueryParams) {
    return this.http
      .get<ApiResponse<T>>(`${this.base}${url}`, { params: this.limpiarParams(params) })
      .pipe(map((res) => this.extraer(res)));
  }

  post<T>(url: string, body: unknown) {
    return this.http
      .post<ApiResponse<T>>(`${this.base}${url}`, body)
      .pipe(map((res) => this.extraer(res)));
  }

  postForm<T>(url: string, formData: FormData) {
    return this.http
      .post<ApiResponse<T>>(`${this.base}${url}`, formData)
      .pipe(map((res) => this.extraer(res)));
  }

  put<T>(url: string, body: unknown) {
    return this.http
      .put<ApiResponse<T>>(`${this.base}${url}`, body)
      .pipe(map((res) => this.extraer(res)));
  }

  patch<T>(url: string, body: unknown = {}) {
    return this.http
      .patch<ApiResponse<T>>(`${this.base}${url}`, body)
      .pipe(map((res) => this.extraer(res)));
  }

  // Todos los DELETE del backend responden 204 sin cuerpo
  delete(url: string) {
    return this.http.delete<void>(`${this.base}${url}`);
  }

  private extraer<T>(res: ApiResponse<T> | T): T {
    if (res && typeof res === 'object' && 'isSuccess' in res && 'details' in res) {
      return (res as ApiResponse<T>).details as T;
    }
    return res as T;
  }

  private limpiarParams(params?: QueryParams): Record<string, string | number | boolean> {
    const limpio: Record<string, string | number | boolean> = {};
    if (!params) return limpio;
    for (const [clave, valor] of Object.entries(params)) {
      if (valor !== null && valor !== undefined && valor !== '') {
        limpio[clave] = valor;
      }
    }
    return limpio;
  }
}