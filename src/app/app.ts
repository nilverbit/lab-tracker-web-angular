import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private http = inject(HttpClient);

  conectado = signal<boolean | null>(null);
  mensaje = signal('Conectando con el backend...');

  constructor() {
    this.http
      .get<{ app: string; version: string }>('/api/')
      .subscribe({
        next: (r) => {
          this.conectado.set(true);
          this.mensaje.set(`${r.app} (v${r.version})`);
        },
        error: () => {
          this.conectado.set(false);
          this.mensaje.set('No se pudo conectar con el backend');
        },
      });
  }
}