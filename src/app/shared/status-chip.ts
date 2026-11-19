import { Component, computed, input } from '@angular/core';

const COLOR: Record<string, string> = {
  // Positivos / activos
  disponible: 'ok',
  operativo: 'ok',
  resuelto: 'ok',
  finalizado: 'ok',
  activo: 'ok',
  activa: 'ok',
  completado: 'ok',
  matriculado: 'ok',

  // En curso / informativos
  programado: 'info',
  en_curso: 'info',
  en_proceso: 'info',
  egresado: 'info',

  // Advertencias / pendientes
  mantenimiento: 'warn',
  en_mantenimiento: 'warn',
  pendiente: 'warn',
  media: 'warn',
  suspendido: 'warn',
  suspendida: 'warn',

  // Críticos / cerrados / vencidos
  con_falla: 'danger',
  cerrado: 'danger',
  inhabilitada: 'danger',
  de_baja: 'danger',
  cancelado: 'danger',
  cancelada: 'danger',
  vencida: 'danger',
  alta: 'danger',
  critica: 'danger',

  // Neutros
  baja: 'gris',
  inactivo: 'gris',
  descontinuado: 'gris',
  retirado: 'gris',
};

const CLASE: Record<string, string> = {
  ok: 'bg-ok-bg text-ok border border-ok/20',
  info: 'bg-blue-50 text-info border border-info/20',
  warn: 'bg-amber-50 text-warn border border-warn/20',
  danger: 'bg-red-50 text-danger border border-danger/20',
  gris: 'bg-slate-100 text-muted border border-slate-200',
};

@Component({
  selector: 'app-status-chip',
  template: `
    <span
      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize whitespace-nowrap"
      [class]="clase()">
      {{ etiqueta() }}
    </span>
  `,
})
export class StatusChip {
  valor = input.required<string>();
  etiqueta = computed(() => this.valor().replaceAll('_', ' '));
  clase = computed(() => CLASE[COLOR[this.valor()] ?? 'gris']);
}