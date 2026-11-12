import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { tema } from '../../constantes/tema';

/** Navegación principal inferior: ediciones y cuenta. */
export default function Layout() {
  return <Tabs screenOptions={({ route }) => ({
    headerShown: false,
    tabBarStyle: { height: 68, paddingTop: 8, paddingBottom: 9, backgroundColor: '#0D130F', borderTopColor: tema.colores.borde, borderTopWidth: 1, elevation: 0 },
    tabBarActiveTintColor: tema.colores.primario,
    tabBarInactiveTintColor: tema.colores.tenue,
    tabBarLabelStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 10, marginTop: 2 },
    tabBarIcon: ({ color, size, focused }) => <MaterialCommunityIcons name={route.name === 'index' ? (focused ? 'trophy' : 'trophy-outline') : (focused ? 'account-circle' : 'account-circle-outline')} color={color} size={size + 2} />,
  })}>
    <Tabs.Screen name="index" options={{ title: 'Ediciones', tabBarLabel: 'Torneos' }} />
    <Tabs.Screen name="cuenta" options={{ title: 'Mi cuenta', tabBarLabel: 'Cuenta' }} />
  </Tabs>;
}
