import React, { useCallback, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Aviso, Boton, Cabecera, Cargando, Etiqueta, Metrica, Pantalla, Secundario, Tarjeta, Titulo, Seccion } from '../../../componentes/ui';
import { api } from '../../../servicios/api';
import type { Evento, Participante } from '../../../tipos';
import { fecha, estado, errorTexto } from '../../../utilidades/formato';
import { useAuth } from '../../../contextos/AuthContext';
import { tema } from '../../../constantes/tema';

/** Portada de una edición y acceso a sus módulos funcionales. */
export default function Detalle() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { usuario } = useAuth();
  const [evento, setEvento] = useState<Evento | null>(null); const [inscrito, setInscrito] = useState(false); const [carga, setCarga] = useState(true); const [error, setError] = useState(''); const [inscribiendo, setInscribiendo] = useState(false);
  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarga(true); setError('');
    try {
      const e = await api.get<Evento>(`/eventos/${id}`); setEvento(e);
      try { await api.get<Participante>(`/eventos/${id}/participantes/yo`); setInscrito(true); }
      catch { setInscrito(false); }
    } catch (e) { setError(errorTexto(e)); }
    finally { setCarga(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { void cargar(true); }, [cargar]));
  const anfitrion = !!evento && (usuario?.rol === 'ADMINISTRADOR' || evento.anfitrionId === usuario?.id);
  const inscribir = async () => { setInscribiendo(true); setError(''); try { await api.post(`/eventos/${id}/participantes/inscribirme`); setInscrito(true); } catch (e) { setError(errorTexto(e)); } finally { setInscribiendo(false); } };
  if (carga && !evento) return <Pantalla><Cargando texto="Cargando la edición…" /></Pantalla>;
  if (!evento) return <Pantalla><Aviso mensaje={error || 'No se ha encontrado la edición.'} /><Boton titulo="Volver a intentar" onPress={() => void cargar()} /></Pantalla>;
  const rutas = [
    { nombre: 'Retos', detalle: 'Desafía a otros participantes', icono: 'sword-cross' as const, ruta: `/evento/${id}/retos` },
    { nombre: 'Partidas', detalle: 'Consulta los enfrentamientos', icono: 'controller-classic' as const, ruta: `/evento/${id}/partidas` },
    { nombre: 'Participantes', detalle: anfitrion ? 'Consulta la lista de inscritos' : 'Consulta la información disponible', icono: 'account-group' as const, ruta: `/evento/${id}/participantes`, restringido: !anfitrion },
    { nombre: 'ApuchiCoins', detalle: 'Tu saldo y movimientos', icono: 'cash-multiple' as const, ruta: `/evento/${id}/monedero` },
    { nombre: 'Orla y sorteo', detalle: 'Deposita papeletas y consulta el resultado', icono: 'ticket-confirmation' as const, ruta: `/evento/${id}/orla` },
  ];
  const tono = evento.estado === 'EN_CURSO' ? 'verde' : evento.estado === 'PERIODO_ADICIONAL' ? 'amarillo' : evento.estado === 'FINALIZADO' ? 'gris' : 'gris';
  return <Pantalla onActualizar={() => void cargar()} actualizando={carga}>
    <Tarjeta destacado estilo={{ padding: 20, gap: 15 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Etiqueta tono={tono}>{estado(evento.estado)}</Etiqueta><MaterialCommunityIcons name="trophy-variant" color={tema.colores.primario} size={30} /></View>
      <Cabecera ceja="EDICIÓN APUCHITORNEO" titulo={evento.premio} descripcion={evento.anfitrion?.nombreVisible ? `Organiza ${evento.anfitrion.nombreVisible}` : 'Una nueva competición está en marcha.'} />
      <View style={{ gap: 9 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><MaterialCommunityIcons name="calendar-start" color={tema.colores.primario} size={17} /><Secundario>Inicio · {fecha(evento.fechaInicio)}</Secundario></View><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><MaterialCommunityIcons name="calendar-end" color={tema.colores.primario} size={17} /><Secundario>Cierre · {fecha(evento.fechaCierreEnfrentamientos)}</Secundario></View></View>
    </Tarjeta>
    {error ? <Aviso mensaje={error} /> : null}
    {!inscrito && !anfitrion ? <Tarjeta><Titulo pequeno>¿Te apuntas?</Titulo><Secundario>Inscríbete para participar en los retos y enfrentamientos de esta edición.</Secundario><Boton titulo="Inscribirme en la edición" icono="account-plus" onPress={() => void inscribir()} cargando={inscribiendo} /></Tarjeta> : <Etiqueta>{anfitrion ? 'PANEL DE ANFITRIÓN DISPONIBLE' : 'ESTÁS INSCRITO'}</Etiqueta>}
    <Seccion titulo="Zona de competición" detalle="Accede a cada apartado del torneo." />
    {rutas.map(r => <PressableModulo key={r.nombre} {...r} onPress={() => router.push(r.ruta as never)} />)}
    {anfitrion ? <Boton titulo="Abrir panel de anfitrión" icono="shield-crown" onPress={() => router.push(`/evento/${id}/anfitrion` as never)} /> : null}
  </Pantalla>;
}

/** Acceso visual a un módulo de la edición con su descripción y permisos. */
function PressableModulo({ nombre, detalle, icono, onPress, restringido }: { nombre: string; detalle: string; icono: keyof typeof MaterialCommunityIcons.glyphMap; onPress: () => void; restringido?: boolean }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, backgroundColor: tema.colores.superficie, borderColor: tema.colores.borde, borderWidth: 1, borderRadius: 18 }}>
    <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: '#22351F', alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name={icono} color={tema.colores.primario} size={24} /></View>
    <View style={{ flex: 1, gap: 3 }}><Titulo pequeno>{nombre}</Titulo><Secundario>{detalle}</Secundario></View>
    <Boton titulo="Abrir" compacto secundario deshabilitado={restringido} onPress={onPress} />
  </View>;
}
