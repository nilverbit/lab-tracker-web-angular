import { Component, computed, input } from '@angular/core';

// Cada valor del backend -> un color semántico
const COLOR: Record<string, string> = {
  disponible: 'ok', operativo: 'ok', resuelto: 'ok', finalizado: 'ok',
  programado: 'info', en_curso: 'info', en_proceso: 'info',
  mantenimiento: 'warn', en_mantenimiento: 'warn', pendiente: 'warn', media: 'warn',
  con_falla: 'danger', cerrado: 'danger', inhabilitada: 'danger',
  de_baja: 'danger', cancelado: 'danger', alta: 'danger', critica: 'danger',
  baja: 'gris',
};

// Clases completas (Tailwind necesita verlas escritas tal cual)
const CLASE: Record<string, string> = {
  ok: 'bg-ok-bg text-ok',
  info: 'bg-blue-100 text-info',
  warn: 'bg-amber-100 text-warn',
  danger: 'bg-red-100 text-danger',
  gris: 'bg-slate-200 text-muted',
};

@Component({
  selector: 'app-status-chip',
  template: `<span
    class="inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize"
    [class]="clase()">{{ etiqueta() }}</span>`,
})
export class StatusChip {
  valor = input.required<string>();
  etiqueta = computed(() => this.valor().replaceAll('_', ' '));
  clase = computed(() => CLASE[COLOR[this.valor()] ?? 'gris']);
}