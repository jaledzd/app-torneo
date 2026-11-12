import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../contextos/AuthContext';
export default function Layout() {
  const { usuario, cargando } = useAuth();
  if (!cargando && usuario) return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
