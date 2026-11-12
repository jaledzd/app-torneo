import React, { useState } from 'react';
import { Link, router } from 'expo-router';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Aviso, Boton, Campo, Pantalla, Secundario, Titulo } from '../../componentes/ui';
import { useAuth } from '../../contextos/AuthContext';
import { errorTexto } from '../../utilidades/formato';
import { tema } from '../../constantes/tema';

/** Acceso de usuarios registrados a sus ediciones y actividad. */
export default function Acceso() {
  const { entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const enviar = async () => {
    if (!email.trim() || !contrasena) return setError('Introduce tu correo y contraseña.');
    setError(''); setOcupado(true);
    try { await entrar(email.trim(), contrasena); router.replace('/(tabs)'); }
    catch (e) { setError(errorTexto(e)); }
    finally { setOcupado(false); }
  };
  return <Pantalla>
    <View style={{ minHeight: 170, justifyContent: 'flex-end', gap: 10, paddingBottom: 12 }}>
      <View style={{ width: 62, height: 62, borderRadius: 20, backgroundColor: tema.colores.primario, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name="trophy-variant" size={34} color={tema.colores.negro} /></View>
      <Text style={{ color: tema.colores.primario, fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }}>APUCHITORNEO / ACCESO DE JUGADOR</Text>
      <Titulo>La competición empieza aquí.</Titulo>
      <Secundario>Entra en tu cuenta y vuelve a la arena.</Secundario>
    </View>
    <View style={{ gap: 15, backgroundColor: tema.colores.superficie, borderColor: tema.colores.borde, borderWidth: 1, borderRadius: 24, padding: 18 }}>
      <Campo etiqueta="Correo electrónico" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="jugador@correo.com" returnKeyType="next" />
      <Campo etiqueta="Contraseña" value={contrasena} onChangeText={setContrasena} secureTextEntry placeholder="Tu contraseña" onSubmitEditing={enviar} />
      {error ? <Aviso mensaje={error} /> : null}
      <Boton titulo="Entrar en la arena" icono="sword-cross" onPress={enviar} cargando={ocupado} />
    </View>
    <View style={{ alignItems: 'center', gap: 8, paddingTop: 8 }}><Secundario>¿Todavía no tienes cuenta?</Secundario><Link href="/(auth)/registro" style={{ color: tema.colores.primario, fontFamily: 'Inter_700Bold', fontSize: 13 }}>Crear mi cuenta</Link></View>
  </Pantalla>;
}
