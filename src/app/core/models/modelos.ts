// ===== Enumeraciones (valores exactos del backend) =====
export type EstadoLaboratorio = 'disponible' | 'mantenimiento' | 'cerrado';
export type EstadoWorkstation = 'disponible' | 'con_falla' | 'en_mantenimiento' | 'inhabilitada';
export type TipoEquipo = 'cpu' | 'monitor' | 'estabilizador' | 'teclado' | 'mouse';
export type EstadoEquipo = 'operativo' | 'con_falla' | 'en_mantenimiento' | 'de_baja';
export type EstadoHorario = 'programado' | 'en_curso' | 'finalizado' | 'cancelado';
export type PrioridadIncidente = 'baja' | 'media' | 'alta' | 'critica';
export type EstadoIncidente = 'pendiente' | 'en_proceso' | 'resuelto';

// Listas para los desplegables
export const ESTADOS_LABORATORIO: EstadoLaboratorio[] = ['disponible', 'mantenimiento', 'cerrado'];
export const ESTADOS_WORKSTATION: EstadoWorkstation[] = ['disponible', 'con_falla', 'en_mantenimiento', 'inhabilitada'];
export const TIPOS_EQUIPO: TipoEquipo[] = ['cpu', 'monitor', 'estabilizador', 'teclado', 'mouse'];
export const ESTADOS_EQUIPO: EstadoEquipo[] = ['operativo', 'con_falla', 'en_mantenimiento', 'de_baja'];
export const PRIORIDADES: PrioridadIncidente[] = ['baja', 'media', 'alta', 'critica'];
export const ESTADOS_INCIDENTE: EstadoIncidente[] = ['pendiente', 'en_proceso', 'resuelto'];

// ===== Laboratorio =====
export interface Laboratorio {
  id: number;
  codigo: string;
  nombre: string;
  ubicacion: string;
  capacidad_workstations: number;
  estado: EstadoLaboratorio;
}
export type LaboratorioCreate = Omit<Laboratorio, 'id'>;

// ===== Workstation =====
export interface Workstation {
  id: number;
  codigo: string;
  ubicacion_interna: string;
  estado: EstadoWorkstation;
  laboratorio_id: number;
}
export type WorkstationCreate = Omit<Workstation, 'id'>;

// ===== Equipo =====
export interface Equipo {
  id: number;
  codigo_patrimonial: string;
  tipo: TipoEquipo;
  marca: string;
  modelo: string;
  numero_serie?: string | null;
  caracteristicas: string;
  estado: EstadoEquipo;
  laboratorio_id: number;
  workstation_id?: number | null;
}
export type EquipoCreate = Omit<Equipo, 'id'>;

// ===== Horario y asignaciones =====
export interface Horario {
  id: number;
  laboratorio_id: number;
  nombre_turno: string;
  docente_responsable: string;
  fecha: string;       // YYYY-MM-DD
  hora_inicio: string; // HH:MM:SS
  hora_fin: string;    // HH:MM:SS
  estado: EstadoHorario;
}
export type HorarioCreate = Omit<Horario, 'id' | 'estado'>;

export interface Asignacion {
  id: number;
  horario_id: number;
  workstation_id: number;
  codigo_alumno: string;
  observaciones?: string | null;
  fecha_asignacion: string;
}
export interface AsignacionCreate {
  workstation_id: number;
  codigo_alumno: string;
  observaciones?: string | null;
}

// ===== Incidente =====
export interface Incidente {
  id: number;
  workstation_id?: number | null;
  equipo_id?: number | null;
  reportado_por: string;
  descripcion: string;
  prioridad: PrioridadIncidente;
  estado: EstadoIncidente;
  fecha_reporte: string;
  fecha_resolucion?: string | null;
}
export interface IncidenteCreate {
  workstation_id?: number | null;
  equipo_id?: number | null;
  reportado_por: string;
  descripcion: string;
  prioridad: PrioridadIncidente;
}