// ===== Envoltorio estándar y paginación del backend v2 =====
export interface DetalleError {
  codigo: string;
  mensaje: string;
  campo?: string | null;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  status: number;
  message: string;
  details: T | null;
  errors: DetalleError[];
  timestamp: string;
  traceId: string;
  path?: string | null;
}

export interface Pagina<T> {
  items: T[];
  total: number;
  pagina: number;
  tamano_pagina: number;
  total_paginas: number;
}

export interface PaginacionParams {
  pagina?: number;
  tamano_pagina?: number;
}

// ===== Enumeraciones (valores exactos del backend) =====
export type EstadoLaboratorio = 'disponible' | 'mantenimiento' | 'cerrado';
export type EstadoWorkstation = 'disponible' | 'con_falla' | 'en_mantenimiento' | 'inhabilitada';
export type CategoriaTipoEquipo =
  | 'hardware'
  | 'software'
  | 'redes'
  | 'periferico'
  | 'almacenamiento'
  | 'seguridad'
  | 'mobiliario'
  | 'otro';
export type EstadoEquipo = 'operativo' | 'con_falla' | 'en_mantenimiento' | 'de_baja';
export type EstadoTipoEquipo = 'activo' | 'inactivo' | 'descontinuado';
export type Moneda = 'pen' | 'usd' | 'eur';
export type TipoDocumento = 'dni' | 'carnet_extranjero' | 'pasaporte' | 'carnet_universitario';
export type EstadoAlumno = 'activo' | 'inactivo' | 'suspendido' | 'egresado';
export type EstadoMatricula = 'matriculado' | 'retirado' | 'completado';
export type TipoLicencia = 'perpetua' | 'suscripcion' | 'oem' | 'academica' | 'prueba' | 'otro';
export type EstadoLicencia = 'activa' | 'vencida' | 'suspendida' | 'cancelada';
export type EstadoHorario = 'programado' | 'en_curso' | 'finalizado' | 'cancelado';
export type PrioridadIncidente = 'baja' | 'media' | 'alta' | 'critica';
export type EstadoIncidente = 'pendiente' | 'en_proceso' | 'resuelto';

/** @deprecated Solo compatibilidad temporal hasta migrar Equipos en Fase 2 */
export type TipoEquipo = 'cpu' | 'monitor' | 'estabilizador' | 'teclado' | 'mouse';
/** @deprecated Solo compatibilidad temporal hasta migrar Equipos en Fase 2 */
export const TIPOS_EQUIPO: TipoEquipo[] = ['cpu', 'monitor', 'estabilizador', 'teclado', 'mouse'];

// ===== Listas para desplegables =====
export const ESTADOS_LABORATORIO: EstadoLaboratorio[] = ['disponible', 'mantenimiento', 'cerrado'];
export const ESTADOS_WORKSTATION: EstadoWorkstation[] = [
  'disponible',
  'con_falla',
  'en_mantenimiento',
  'inhabilitada',
];
export const CATEGORIAS_TIPO_EQUIPO: CategoriaTipoEquipo[] = [
  'hardware',
  'software',
  'redes',
  'periferico',
  'almacenamiento',
  'seguridad',
  'mobiliario',
  'otro',
];
export const ESTADOS_EQUIPO: EstadoEquipo[] = [
  'operativo',
  'con_falla',
  'en_mantenimiento',
  'de_baja',
];
export const ESTADOS_TIPO_EQUIPO: EstadoTipoEquipo[] = ['activo', 'inactivo', 'descontinuado'];
export const MONEDAS: Moneda[] = ['pen', 'usd', 'eur'];
export const TIPOS_DOCUMENTO: TipoDocumento[] = [
  'dni',
  'carnet_extranjero',
  'pasaporte',
  'carnet_universitario',
];
export const ESTADOS_ALUMNO: EstadoAlumno[] = ['activo', 'inactivo', 'suspendido', 'egresado'];
export const TIPOS_LICENCIA: TipoLicencia[] = [
  'perpetua',
  'suscripcion',
  'oem',
  'academica',
  'prueba',
  'otro',
];
export const ESTADOS_LICENCIA: EstadoLicencia[] = ['activa', 'vencida', 'suspendida', 'cancelada'];
export const ESTADOS_HORARIO: EstadoHorario[] = [
  'programado',
  'en_curso',
  'finalizado',
  'cancelado',
];
export const PRIORIDADES: PrioridadIncidente[] = ['baja', 'media', 'alta', 'critica'];
export const ESTADOS_INCIDENTE: EstadoIncidente[] = ['pendiente', 'en_proceso', 'resuelto'];

// ===== Autenticación, Roles y Usuarios =====
export type RolClave = 'admin' | 'gestion_laboratorios' | 'docente';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  username: string;
  rol: string;
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
  es_activo: boolean;
  creado_en: string;
}
export interface RolCreate {
  nombre: string;
  descripcion: string;
  es_activo?: boolean;
}
export type RolUpdate = Partial<RolCreate>;

export interface Usuario {
  id: number;
  username: string;
  nombres: string;
  apellidos: string;
  correo?: string | null;
  url_imagen?: string | null;
  activo: boolean;
  rol_id: number;
  creado_en: string;
  actualizado_en: string;
}
export interface UsuarioCreate {
  username: string;
  nombres: string;
  apellidos: string;
  correo?: string | null;
  url_imagen?: string | null;
  activo?: boolean;
  rol_id: number;
  password: string;
}
export type UsuarioUpdate = Partial<UsuarioCreate>;

// ===== Laboratorio =====
export interface Laboratorio {
  id: number;
  codigo: string;
  nombre: string;
  ubicacion: string;
  capacidad_workstations: number;
  estado: EstadoLaboratorio;
  url_imagen?: string | null;
}
export type LaboratorioCreate = Omit<Laboratorio, 'id'>;
export type LaboratorioUpdate = Partial<LaboratorioCreate>;

// ===== Workstation =====
export interface Workstation {
  id: number;
  codigo: string;
  ubicacion_interna: string;
  estado: EstadoWorkstation;
  laboratorio_id: number;
}
export type WorkstationCreate = Omit<Workstation, 'id'>;
export type WorkstationUpdate = Partial<WorkstationCreate>;

// ===== Catálogo de Tipos de Equipo =====
export interface TipoEquipoCatalogo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaTipoEquipo;
  especificaciones_minimas?: string | null;
  vida_util_meses?: number | null;
  requiere_mantenimiento: boolean;
  requiere_licencia: boolean;
  costo_referencial?: number | null;
  moneda: Moneda;
  estado: EstadoTipoEquipo;
  creado_en: string;
  actualizado_en: string;
}
export type TipoEquipoCreate = Omit<TipoEquipoCatalogo, 'id' | 'creado_en' | 'actualizado_en'>;
export type TipoEquipoUpdate = Partial<TipoEquipoCreate>;

// ===== Equipo =====
export interface Equipo {
  id: number;
  codigo_patrimonial: string;
  categoria?: CategoriaTipoEquipo;
  /** @deprecated Temporal hasta migrar Equipos en Fase 2 */
  tipo?: TipoEquipo;
  marca: string;
  modelo: string;
  numero_serie?: string | null;
  caracteristicas: string;
  estado: EstadoEquipo;
  laboratorio_id: number;
  workstation_id?: number | null;
  tipo_equipo_id?: number | null;
  costo_estimado?: number | null;
  costo_adquisicion?: number | null;
  moneda?: Moneda;
  fecha_adquisicion?: string | null;
  proveedor?: string | null;
  garantia_hasta?: string | null;
  observaciones?: string | null;
  url_imagen?: string | null;
}
export type EquipoCreate = Omit<Equipo, 'id'>;
export type EquipoUpdate = Partial<EquipoCreate>;

// ===== Alumnos y Matrículas =====
export interface Alumno {
  id: number;
  codigo: string;
  nombres: string;
  apellidos: string;
  tipo_documento: TipoDocumento;
  numero_documento?: string | null;
  correo_institucional: string;
  correo_personal?: string | null;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
  carrera: string;
  semestre?: number | null;
  grupo?: string | null;
  estado: EstadoAlumno;
  fecha_ingreso?: string;
  observaciones?: string | null;
  creado_en: string;
  actualizado_en: string;
}
export type AlumnoCreate = Omit<Alumno, 'id' | 'creado_en' | 'actualizado_en'>;
export type AlumnoUpdate = Partial<AlumnoCreate>;

export interface Matricula {
  id: number;
  alumno_id: number;
  horario_id: number;
  fecha_matricula: string;
  estado: EstadoMatricula;
  observaciones?: string | null;
  alumno?: Alumno | null;
}

export interface ColumnaPlantilla {
  nombre: string;
  requerida: boolean;
  descripcion: string;
}

export interface ErrorFilaExcel {
  fila: number;
  codigo?: string | null;
  campo: string;
  mensaje: string;
}

export interface ResultadoCargaMatricula {
  horario_id: number;
  total_filas_leidas: number;
  filas_validas: number;
  alumnos_creados: number;
  alumnos_reutilizados: number;
  registros_insertados: number;
  filas_con_error: number;
  errores: ErrorFilaExcel[];
  modo: string;
  mensaje: string;
}

// ===== Licencias de Software =====
export interface Licencia {
  id: number;
  codigo: string;
  nombre: string;
  tipo: TipoLicencia;
  clave_producto?: string | null;
  fabricante?: string | null;
  cantidad_usuarios: number;
  fecha_adquisicion?: string | null;
  fecha_vencimiento?: string | null;
  costo?: number | null;
  moneda: Moneda;
  estado: EstadoLicencia;
  equipo_id?: number | null;
  tipo_equipo_id?: number | null;
  observaciones?: string | null;
  creado_en: string;
  actualizado_en: string;
}
export type LicenciaCreate = Omit<Licencia, 'id' | 'creado_en' | 'actualizado_en'>;
export type LicenciaUpdate = Partial<LicenciaCreate>;

// ===== Horarios y Asignaciones =====
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
  alumno_id?: number | null;
  codigo_alumno: string;
  observaciones?: string | null;
  fecha_asignacion: string;
}
export interface AsignacionCreate {
  workstation_id: number;
  codigo_alumno: string;
  observaciones?: string | null;
}

// ===== Incidentes =====
export interface Incidente {
  id: number;
  workstation_id?: number | null;
  equipo_id?: number | null;
  reportado_por: string;
  descripcion: string;
  prioridad: PrioridadIncidente;
  estado: EstadoIncidente;
  url_imagenes?: string[] | null;
  fecha_reporte: string;
  fecha_resolucion?: string | null;
}
export interface IncidenteCreate {
  workstation_id?: number | null;
  equipo_id?: number | null;
  reportado_por: string;
  descripcion: string;
  prioridad: PrioridadIncidente;
  url_imagenes?: string[] | null;
}
export interface IncidenteEstadoUpdate {
  estado: EstadoIncidente;
  url_imagenes?: string[] | null;
}