import React, { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Aviso, Boton, Cabecera, Cargando, Etiqueta, Pantalla, Secundario, Seccion, Tarjeta, Titulo } from '../../../componentes/ui';
import { api } from '../../../servicios/api';
import type { Disponible, Puesto, Reto, Videojuego } from '../../../tipos';
import { errorTexto, fecha } from '../../../utilidades/formato';
import { tema } from '../../../constantes/tema';

/** Bandeja de retos recibidos y envío de nuevos desafíos. */
export default function Retos() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [retos, setRetos] = useState<Reto[]>([]); const [jugadores, setJugadores] = useState<Disponible[]>([]); const [puestos, setPuestos] = useState<Puesto[]>([]); const [juegos, setJuegos] = useState<Videojuego[]>([]);
  const [puesto, setPuesto] = useState(''); const [juego, setJuego] = useState(''); const [error, setError] = useState(''); const [carga, setCarga] = useState(true); const [ocupado, setOcupado] = useState('');
  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarga(true); setError('');
    try { const [r, j, p, v] = await Promise.all([api.get<Reto[]>(`/eventos/${id}/retos/recibidos`), api.get<Disponible[]>(`/eventos/${id}/participantes/disponibles`), api.get<Puesto[]>(`/eventos/${id}/puestos`), api.get<Videojuego[]>('/videojuegos')]); setRetos(r); setJugadores(j); setPuestos(p); setJuegos(v); }
    catch (e) { setError(errorTexto(e)); }
    finally { setCarga(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { void cargar(true); }, [cargar]));
  const accion = async (clave: string, ruta: string, cuerpo?: unknown) => { setOcupado(clave); setError(''); try { await api.post(ruta, cuerpo); setPuesto(''); setJuego(''); await cargar(true); } catch (e) { setError(errorTexto(e)); } finally { setOcupado(''); } };
  if (carga && !retos.length && !jugadores.length) return <Pantalla><Cargando texto="Buscando jugadores y retos…" /></Pantalla>;
  return <Pantalla onActualizar={() => void cargar()} actualizando={carga}>
    <Cabecera ceja="ZONA DE DESAFÍOS" titulo="Retos" descripcion="Lanza un desafío o responde a quien te ha retado." lado={<MaterialCommunityIcons name="sword-cross" color={tema.colores.primario} size={32} />} />
    {error ? <Aviso mensaje={error} /> : null}
    <Seccion titulo="Retos recibidos" detalle={`${retos.length} solicitudes en tu bandeja`} />
    {retos.length === 0 ? <Tarjeta style={{ alignItems: 'center' }}><MaterialCommunityIcons name="email-open-outline" color={tema.colores.tenue} size={36} /><Titulo pequeno>No tienes retos pendientes</Titulo><Secundario style={{ textAlign: 'center' }}>Cuando otro participante te desafíe, aparecerá aquí.</Secundario></Tarjeta> : retos.map(r => <Tarjeta key={r.id} destacado>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Etiqueta tono="amarillo">NUEVO RETO</Etiqueta><Secundario>Caduca · {fecha(r.caducaEn)}</Secundario></View>
      <Titulo pequeno>{r.emisor?.usuario?.nombreVisible || 'Un participante te ha retado'}</Titulo>
      <Secundario>Elige el puesto y el videojuego para aceptar el enfrentamiento.</Secundario>
      <Secundario>Puesto de juego</Secundario>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{puestos.map(p => <Boton key={p.id} titulo={p.codigo} compacto secundario={puesto !== p.id} onPress={() => { setPuesto(p.id); setJuego(''); }} />)}</View>
      <Secundario>Videojuego compatible</Secundario>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{juegos.filter(v => !puesto || puestos.find(p => p.id === puesto)?.videojuegos?.some(x => x.id === v.id)).map(v => <Boton key={v.id} titulo={v.nombre} compacto secundario={juego !== v.id} onPress={() => setJuego(v.id)} />)}</View>
      <Boton titulo="Aceptar reto" icono="check-circle" deshabilitado={!puesto || !juego} cargando={ocupado === `aceptar-${r.id}`} onPress={() => void accion(`aceptar-${r.id}`, `/eventos/${id}/retos/${r.id}/aceptar`, { puestoId: puesto, videojuegoId: juego })} />
      <Boton titulo="Rechazar reto" icono="close-circle-outline" secundario peligro cargando={ocupado === `rechazar-${r.id}`} onPress={() => void accion(`rechazar-${r.id}`, `/eventos/${id}/retos/${r.id}/rechazar`)} />
    </Tarjeta>)}
    <Seccion titulo="Jugadores disponibles" detalle="Participantes que pueden recibir un desafío ahora." />
    {jugadores.length === 0 ? <Tarjeta><Secundario>No hay jugadores disponibles en este momento.</Secundario></Tarjeta> : jugadores.map(j => <View key={j.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, backgroundColor: tema.colores.superficie, borderColor: tema.colores.borde, borderWidth: 1, borderRadius: 17 }}>
      <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: '#253A23', alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name="account" color={tema.colores.primario} size={23} /></View>
      <View style={{ flex: 1 }}><Titulo pequeno>{j.nombreVisible}</Titulo><Secundario>Disponible</Secundario></View>
      <Boton titulo="Retar" compacto icono="sword" cargando={ocupado === `enviar-${j.id}`} onPress={() => void accion(`enviar-${j.id}`, `/eventos/${id}/retos`, { destinatarioId: j.id })} />
    </View>)}
  </Pantalla>;
}
