import { almacenamiento } from './almacenamiento';

/** URL base del backend. Se configura con EXPO_PUBLIC_API_URL en cada entorno. */
const BASE = 'http://192.168.1.24:3000';

/** Error de transporte HTTP con su código de estado para mostrar mensajes útiles. */
export class ErrorApi extends Error {
  constructor(message: string, public status: number) { super(message); this.name = 'ErrorApi'; }
}

type Opciones = { method?: string; body?: unknown; auth?: boolean };

/** Ejecuta una petición JSON, adjunta el token si corresponde y normaliza los errores. */
export async function peticion<T>(ruta: string, { method = 'GET', body, auth = true }: Opciones = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = await almacenamiento.obtenerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  let respuesta: Response;
  try {
    respuesta = await fetch(BASE + ruta, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ErrorApi('No se pudo conectar con el backend. Comprueba la URL y que el servidor esté iniciado.', 0);
  }
  const texto = await respuesta.text();
  let datos: unknown = null;
  try { datos = texto ? JSON.parse(texto) : null; } catch { datos = texto; }
  if (!respuesta.ok) {
    const detalle = datos && typeof datos === 'object' && 'message' in datos ? (datos as { message?: unknown }).message : undefined;
    const alternativo = datos && typeof datos === 'object' && 'error' in datos ? (datos as { error?: unknown }).error : undefined;
    const mensaje = Array.isArray(detalle) ? detalle.join('\n') : typeof detalle === 'string' ? detalle : typeof alternativo === 'string' ? alternativo : 'Error en la petición.';
    throw new ErrorApi(mensaje, respuesta.status);
  }
  return datos as T;
}

/** Operaciones HTTP disponibles para las pantallas de la aplicación. */
export const api = {
  get: <T>(ruta: string) => peticion<T>(ruta),
  post: <T>(ruta: string, cuerpo?: unknown) => peticion<T>(ruta, { method: 'POST', body: cuerpo }),
  patch: <T>(ruta: string, cuerpo: unknown) => peticion<T>(ruta, { method: 'PATCH', body: cuerpo }),
  delete: <T>(ruta: string) => peticion<T>(ruta, { method: 'DELETE' }),
};
