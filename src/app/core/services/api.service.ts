import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

type Params = Record<string, string | number | boolean>;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = '/api'; // el proxy lo reenvía al backend

  get<T>(url: string, params?: Params) {
    return this.http.get<T>(`${this.base}${url}`, { params });
  }
  post<T>(url: string, body: unknown) {
    return this.http.post<T>(`${this.base}${url}`, body);
  }
  put<T>(url: string, body: unknown) {
    return this.http.put<T>(`${this.base}${url}`, body);
  }
  patch<T>(url: string, body: unknown = {}) {
    return this.http.patch<T>(`${this.base}${url}`, body);
  }
  delete(url: string) {
    return this.http.delete<void>(`${this.base}${url}`);
  }
}