import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <div class="flex items-center justify-between mb-6 gap-4">
      <div>
        <h1 class="text-2xl font-bold text-ink">{{ titulo() }}</h1>
        @if (subtitulo()) {
          <p class="text-sm text-muted">{{ subtitulo() }}</p>
        }
      </div>
      <div><ng-content /></div>
    </div>`,
})
export class PageHeader {
  titulo = input.required<string>();
  subtitulo = input<string>('');
}