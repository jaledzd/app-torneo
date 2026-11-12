import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../contextos/AuthContext';
import { tema } from '../constantes/tema';

export default function Inicio() {
  const { usuario, cargando } = useAuth();
  if (cargando) return <View style={{ flex: 1, backgroundColor: tema.colores.fondo, justifyContent: 'center' }}><ActivityIndicator color={tema.colores.acento} /></View>;
  return <Redirect href={usuario ? '/(tabs)' : '/(auth)/acceso'} />;
}
