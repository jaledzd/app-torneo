/** Convierte una fecha ISO en fecha y hora local española. */
export const fecha = (valor?: string | null) => valor ? new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(valor)) : 'Sin fecha';

/** Traduce estados conocidos del backend a etiquetas comprensibles en la interfaz. */
const etiquetas: Record<string, string> = {
  BORRADOR: 'Configuración', EN_CURSO: 'En curso', PERIODO_ADICIONAL: 'Periodo adicional', FINALIZADO: 'Finalizado',
  PENDIENTE: 'Pendiente', ACEPTADO: 'Aceptado', RECHAZADO: 'Rechazado', CADUCADO: 'Caducado',
};
export const estado = (valor: string) => etiquetas[valor] || valor.replaceAll('_', ' ');

/** Obtiene un mensaje seguro para mostrar errores de operaciones asíncronas. */
export const errorTexto = (error: unknown) => error instanceof Error ? error.message : 'Se ha producido un error inesperado.';
