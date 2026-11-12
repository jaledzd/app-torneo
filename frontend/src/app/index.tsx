import React from 'react';
import { Redirect } from 'expo-router';
import { Cargando, Pantalla } from '../componentes/ui';
import { useAuth } from '../contextos/AuthContext';

/** Punto de entrada: espera a recuperar la sesión y deriva a la zona correcta. */
export default function Inicio() {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Pantalla sinDesplazamiento><Cargando texto="Preparando APUCHITORNEO…" /></Pantalla>;
  return <Redirect href={usuario ? '/(tabs)' : '/(auth)/acceso'} />;
}
