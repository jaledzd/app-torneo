import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../servicios/api';
import { almacenamiento } from '../servicios/almacenamiento';
import type { Sesion, Usuario } from '../tipos';

interface Auth {
  usuario: Usuario | null;
  cargando: boolean;
  entrar: (email: string, contrasena: string) => Promise<void>;
  registrar: (nombreVisible: string, email: string, contrasena: string) => Promise<void>;
  salir: () => Promise<void>;
}
const Contexto = createContext<Auth | null>(null);

/** Mantiene la sesión en almacenamiento seguro y comparte el usuario con la navegación. */
export function AuthProvider({ children }: React.PropsWithChildren) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    Promise.all([almacenamiento.obtenerToken(), almacenamiento.obtenerUsuario<Usuario>()])
      .then(([token, usuarioGuardado]) => {
        if (vivo && token && usuarioGuardado) setUsuario(usuarioGuardado);
        else if (vivo && (!token || !usuarioGuardado)) return almacenamiento.limpiar();
      })
      .catch(() => almacenamiento.limpiar())
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, []);

  /** Autentica contra el backend y persiste token y perfil devueltos por la API. */
  const entrar = async (email: string, contrasena: string) => {
    const sesion = await api.post<Sesion>('/autenticacion/iniciar-sesion', { email, contrasena });
    await almacenamiento.guardar(sesion.tokenAcceso, sesion.usuario);
    setUsuario(sesion.usuario);
  };

  /** Registra una cuenta pública; el rol inicial lo determina el backend. */
  const registrar = async (nombreVisible: string, email: string, contrasena: string) => {
    await api.post('/usuarios/registro', { nombreVisible, email, contrasena });
  };

  /** Elimina las credenciales locales y termina la sesión. */
  const salir = async () => { await almacenamiento.limpiar(); setUsuario(null); };
  const valor = useMemo(() => ({ usuario, cargando, entrar, registrar, salir }), [usuario, cargando]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

/** Hook de acceso al contexto de autenticación. */
export function useAuth() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useAuth requiere AuthProvider');
  return contexto;
}
