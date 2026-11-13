import React from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { tema } from '../../../constantes/tema';
import { SorteoEnVivo } from '../../../componentes/SorteoEnVivo';

/** Navegación apilada dentro de una edición, con la experiencia global del sorteo. */
export default function Layout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <>
    <Stack screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: tema.colores.fondo },
      headerTintColor: tema.colores.texto,
      headerTitleStyle: { fontFamily: 'Rajdhani_700Bold', fontSize: 21 },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: tema.colores.fondo },
      animation: 'slide_from_right',
    }}>
      <Stack.Screen name="index" options={{
        title: 'Edición',
        headerLeft: () => (
          <Pressable accessibilityRole="button" accessibilityLabel="Volver a torneos" onPress={() => router.back()} hitSlop={12} style={{ paddingRight: 18 }}>
            <MaterialCommunityIcons name="arrow-left" size={25} color={tema.colores.texto} />
          </Pressable>
        ),
      }} />
      <Stack.Screen name="retos" options={{ title: 'Retos' }} />
      <Stack.Screen name="partidas" options={{ title: 'Partidas' }} />
      <Stack.Screen name="participantes" options={{ title: 'Participantes' }} />
      <Stack.Screen name="monedero" options={{ title: 'ApuchiCoins' }} />
      <Stack.Screen name="orla" options={{ title: 'Orla y sorteo' }} />
      <Stack.Screen name="anfitrion" options={{ title: 'Panel de anfitrión' }} />
    </Stack>
    <SorteoEnVivo eventoId={id} />
  </>;
}
