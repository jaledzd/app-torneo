import React, { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Aviso, Boton, Cargando, Cabecera, Etiqueta, Pantalla, Secundario, Tarjeta, Titulo, Seccion } from '../../componentes/ui';
import { api } from '../../servicios/api';
import type { Evento } from '../../tipos';
import { fecha, estado, errorTexto } from '../../utilidades/formato';
import { useAuth } from '../../contextos/AuthContext';
import { tema } from '../../constantes/tema';

/** Listado principal. Se vuelve a consultar cada vez que el usuario regresa a esta pestaña. */
export default function Ediciones() {
  const { usuario } = useAuth();
  const [lista, setLista] = useState<Evento[]>([]); const [carga, setCarga] = useState(true); const [error, setError] = useState('');
  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarga(true);
    setError('');
    try { setLista(await api.get<Evento[]>('/eventos')); }
    catch (e) { setError(errorTexto(e)); }
    finally { setCarga(false); }
  }, []);
  useFocusEffect(useCallback(() => { void cargar(true); }, [cargar]));
  const anfitrion = ['ANFITRION', 'ADMINISTRADOR'].includes(usuario?.rol || '');
  return <Pantalla onActualizar={() => void cargar()} actualizando={carga}>
    <Cabecera ceja="APUCHITORNEO / CENTRO" titulo={`Qué tal, ${usuario?.nombreVisible?.split(' ')[0] || 'jugador'}.`} descripcion="Tu próxima partida empieza en una edición." lado={<View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#1C2D1C', alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name="controller-classic" color={tema.colores.primario} size={26} /></View>} />
    <Tarjeta destacado estilo={{ padding: 19, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Etiqueta>COMPETICIÓN PRESENCIAL</Etiqueta><MaterialCommunityIcons name="lightning-bolt" color={tema.colores.primario} size={22} /></View>
      <Titulo>Reúne al equipo. Que empiece el juego.</Titulo>
      <Secundario>Entra en una edición, acepta retos, juega tus partidas y consigue ApuchiCoins.</Secundario>
      {anfitrion ? <Boton titulo="Crear una edición" icono="plus-circle" onPress={() => router.push('/crear-evento')} /> : null}
    </Tarjeta>
    <Seccion titulo="Ediciones disponibles" detalle={`${lista.length} ${lista.length === 1 ? 'edición' : 'ediciones'} en el sistema`} lado={<MaterialCommunityIcons name="trophy-outline" color={tema.colores.primario} size={22} />} />
    {error ? <Aviso mensaje={error} /> : null}
    {carga && lista.length === 0 ? <Cargando texto="Buscando ediciones…" /> : lista.length === 0 ? (
      <Tarjeta estilo={{ alignItems: 'center', paddingVertical: 28 }}>
        <MaterialCommunityIcons name="trophy-broken" color={tema.colores.tenue} size={42} />
        <Titulo pequeno>No hay ediciones todavía</Titulo>
        <Secundario style={{ textAlign: 'center' }}>{anfitrion ? 'Crea la primera edición para preparar el torneo.' : 'Cuando se publique una edición, aparecerá aquí.'}</Secundario>
        {anfitrion ? <Boton titulo="Crear primera edición" onPress={() => router.push('/crear-evento')} /> : null}
      </Tarjeta>
    ) : lista.map((e, indice) => (
      <PressableEvento key={e.id} evento={e} indice={indice} onPress={() => router.push(`/evento/${e.id}`)} />
    ))}
    <Text style={{ color: tema.colores.tenue, fontFamily: 'Inter_400Regular', fontSize: 10, textAlign: 'center', marginTop: 4 }}>Desliza hacia abajo para actualizar la lista.</Text>
  </Pantalla>;
}

/** Presenta una edición con su estado, calendario y acceso directo. */
function PressableEvento({ evento, indice, onPress }: { evento: Evento; indice: number; onPress: () => void }) {
  const tono = evento.estado === 'EN_CURSO' ? 'verde' : evento.estado === 'FINALIZADO' ? 'gris' : evento.estado === 'PERIODO_ADICIONAL' ? 'amarillo' : 'gris';
  return <View style={{ backgroundColor: tema.colores.superficie, borderWidth: 1, borderColor: tema.colores.borde, borderRadius: 22, padding: 17, gap: 12 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ color: tema.colores.tenue, fontFamily: 'Inter_600SemiBold', fontSize: 10 }}>EDICIÓN {String(indice + 1).padStart(2, '0')}</Text><Etiqueta tono={tono}>{estado(evento.estado)}</Etiqueta></View>
    <Titulo pequeno>{evento.premio}</Titulo>
    <View style={{ gap: 7 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><MaterialCommunityIcons name="calendar-clock" color={tema.colores.secundario} size={16} /><Secundario>Inicio · {fecha(evento.fechaInicio)}</Secundario></View><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><MaterialCommunityIcons name="timer-outline" color={tema.colores.secundario} size={16} /><Secundario>Cierre · {fecha(evento.fechaCierreEnfrentamientos)}</Secundario></View></View>
    <Boton titulo="Entrar en la edición" icono="arrow-right" onPress={onPress} />
  </View>;
}
