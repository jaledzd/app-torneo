import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN = 'apuchitorneo_token';
const USUARIO = 'apuchitorneo_usuario';

/** Lee un dato local: SecureStore en móvil y almacenamiento del navegador en web. */
async function leer(clave: string): Promise<string | null> {
  return Platform.OS === 'web' ? (typeof localStorage === 'undefined' ? null : localStorage.getItem(clave)) : SecureStore.getItemAsync(clave);
}

/** Persiste un dato local usando el mecanismo adecuado a la plataforma. */
async function escribir(clave: string, valor: string): Promise<void> {
  if (Platform.OS === 'web') { if (typeof localStorage !== 'undefined') localStorage.setItem(clave, valor); }
  else await SecureStore.setItemAsync(clave, valor);
}

/** Elimina un dato local de la plataforma actual. */
async function borrar(clave: string): Promise<void> {
  if (Platform.OS === 'web') { if (typeof localStorage !== 'undefined') localStorage.removeItem(clave); }
  else await SecureStore.deleteItemAsync(clave);
}

/** Acceso centralizado al token y al perfil guardados en el dispositivo. */
export const almacenamiento = {
  obtenerToken: () => leer(TOKEN),
  async obtenerUsuario<T>(): Promise<T | null> {
    const valor = await leer(USUARIO);
    if (!valor) return null;
    try { return JSON.parse(valor) as T; }
    catch { await borrar(USUARIO); return null; }
  },
  async guardar(token: string, usuario: unknown): Promise<void> {
    await escribir(TOKEN, token);
    await escribir(USUARIO, JSON.stringify(usuario));
  },
  async limpiar(): Promise<void> { await Promise.all([borrar(TOKEN), borrar(USUARIO)]); },
};
