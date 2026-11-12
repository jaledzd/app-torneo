import React, { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Boton, Cabecera, Etiqueta, Pantalla, Secundario, Tarjeta, Titulo } from '../../componentes/ui';
import { useAuth } from '../../contextos/AuthContext';
import { tema } from '../../constantes/tema';

/** Perfil básico y cierre seguro de sesión. El rol no se modifica desde el cliente. */
export default function Cuenta() {
  const { usuario, salir } = useAuth(); const [ocupado, setOcupado] = useState(false);
  const cerrar = async () => { setOcupado(true); try { await salir(); router.replace('/(auth)/acceso'); } finally { setOcupado(false); } };
  return <Pantalla>
    <Cabecera ceja="PERFIL DE JUGADOR" titulo="Mi cuenta" descripcion="Tu identidad dentro de APUCHITORNEO." />
    <Tarjeta destacado style={{ alignItems: 'center', paddingVertical: 25 }}>
      <View style={{ width: 82, height: 82, borderRadius: 28, backgroundColor: '#263D23', borderWidth: 1, borderColor: '#5D8D37', alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name="account-circle" color={tema.colores.primario} size={58} /></View>
      <Titulo>{usuario?.nombreVisible || 'Jugador'}</Titulo>
      <Secundario>{usuario?.email}</Secundario>
      <Etiqueta>{usuario?.rol || 'PARTICIPANTE'}</Etiqueta>
    </Tarjeta>
    <Titulo pequeno>Seguridad y permisos</Titulo>
    <Tarjeta>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><MaterialCommunityIcons name="shield-check" color={tema.colores.primario} size={22} /><Titulo pequeno>Cuenta protegida</Titulo></View>
      <Secundario>Los permisos y el rol se validan en el backend. No es posible modificar el rol desde la aplicación.</Secundario>
    </Tarjeta>
    <Boton titulo="Cerrar sesión" icono="logout" secundario peligro onPress={() => void cerrar()} cargando={ocupado} />
  </Pantalla>;
}
