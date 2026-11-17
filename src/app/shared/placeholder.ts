import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageHeader } from './page-header';

@Component({
  selector: 'app-placeholder',
  imports: [PageHeader],
  template: `
    <app-page-header [titulo]="titulo" subtitulo="Pantalla en construcción" />
    <div class="rounded-xl bg-white p-8 shadow text-muted">
      Esta sección se construye en una fase siguiente.
    </div>`,
})
export class Placeholder {
  titulo: string = inject(ActivatedRoute).snapshot.data['titulo'];
}