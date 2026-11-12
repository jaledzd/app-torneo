import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider } from '../contextos/AuthContext';
import { tema } from '../constantes/tema';

/** Carga la identidad tipográfica antes de mostrar cualquier pantalla. */
export default function Layout() {
  const [fuentesCargadas] = useFonts({ Rajdhani_600SemiBold, Rajdhani_700Bold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  if (!fuentesCargadas) return <View style={{ flex: 1, backgroundColor: tema.colores.fondo, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={tema.colores.primario} size="large" /></View>;
  return <AuthProvider><StatusBar style="light" /><Stack screenOptions={{ headerStyle: { backgroundColor: tema.colores.fondo }, headerTintColor: tema.colores.texto, headerTitleStyle: { fontFamily: 'Rajdhani_700Bold', fontSize: 21 }, headerShadowVisible: false, contentStyle: { backgroundColor: tema.colores.fondo }, animation: 'slide_from_right' }}>
    <Stack.Screen name="index" options={{ headerShown: false }} />
    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="evento/[id]" options={{ title: 'Edición' }} />
    <Stack.Screen name="crear-evento" options={{ title: 'Nueva edición' }} />
  </Stack></AuthProvider>;
}
