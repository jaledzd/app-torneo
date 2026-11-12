import React, { useState } from 'react';
import { Link, router } from 'expo-router';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Aviso, Boton, Campo, Pantalla, Secundario, Titulo } from '../../componentes/ui';
import { useAuth } from '../../contextos/AuthContext';
import { errorTexto } from '../../utilidades/formato';
import { tema } from '../../constantes/tema';

/** Alta pública: el backend asigna inicialmente el rol de participante. */
export default function Registro() {
  const { registrar } = useAuth();
  const [nombre, setNombre] = useState(''); const [email, setEmail] = useState(''); const [clave, setClave] = useState('');
  const [error, setError] = useState(''); const [ocupado, setOcupado] = useState(false);
  const enviar = async () => {
    setError('');
    if (nombre.trim().length < 2) return setError('El nombre debe tener al menos 2 caracteres.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Introduce un correo electrónico válido.');
    if (clave.length < 10 || !/[a-z]/.test(clave) || !/[A-Z]/.test(clave) || !/[0-9]/.test(clave)) return setError('La contraseña requiere 10 caracteres, mayúscula, minúscula y número.');
    setOcupado(true);
    try { await registrar(nombre.trim(), email.trim(), clave); router.replace('/(auth)/acceso'); }
    catch (e) { setError(errorTexto(e)); }
    finally { setOcupado(false); }
  };
  return <Pantalla>
    <View style={{ minHeight: 145, justifyContent: 'flex-end', gap: 9 }}><MaterialCommunityIcons name="account-multiple-plus" size={38} color={tema.colores.primario} /><Text style={{ color: tema.colores.primario, fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }}>NUEVO JUGADOR</Text><Titulo>Únete a la partida.</Titulo><Secundario>Crea tu perfil para participar en las próximas ediciones.</Secundario></View>
    <View style={{ backgroundColor: tema.colores.superficie, borderColor: tema.colores.borde, borderWidth: 1, borderRadius: 24, padding: 18, gap: 15 }}>
      <Campo etiqueta="Nombre visible" value={nombre} onChangeText={setNombre} placeholder="Cómo te verá el resto" maxLength={60} />
      <Campo etiqueta="Correo electrónico" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="jugador@correo.com" />
      <Campo etiqueta="Contraseña" value={clave} onChangeText={setClave} secureTextEntry placeholder="Mínimo 10 caracteres" />
      <Secundario>Incluye mayúscula, minúscula y número. El registro crea una cuenta de participante.</Secundario>
      {error ? <Aviso mensaje={error} /> : null}
      <Boton titulo="Crear cuenta" icono="account-check" onPress={enviar} cargando={ocupado} />
    </View>
    <View style={{ alignItems: 'center', gap: 8 }}><Secundario>¿Ya formas parte del torneo?</Secundario><Link href="/(auth)/acceso" style={{ color: tema.colores.primario, fontFamily: 'Inter_700Bold', fontSize: 13 }}>Volver al acceso</Link></View>
  </Pantalla>;
}
