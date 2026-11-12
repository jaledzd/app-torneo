import React, { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Aviso, Boton, Cabecera, Campo, Cargando, Etiqueta, Metrica, Pantalla, Secundario, Seccion, Tarjeta, Titulo } from '../../../componentes/ui';
import { api } from '../../../servicios/api';
import type { Evento, Participante, Videojuego, Puesto, Partida } from '../../../tipos';
import { errorTexto, fecha, estado } from '../../../utilidades/formato';
import { tema } from '../../../constantes/tema';

/** Herramientas de gestión de una edición para su anfitrión o administrador. */
export default function PanelAnfitrion() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [evento, setEvento] = useState<Evento | null>(null); const [participantes, setParticipantes] = useState<Participante[]>([]); const [juegos, setJuegos] = useState<Videojuego[]>([]); const [puestos, setPuestos] = useState<Puesto[]>([]); const [partidas, setPartidas] = useState<Partida[]>([]);
  const [participante, setParticipante] = useState(''); const [cantidad, setCantidad] = useState('1'); const [nombreJuego, setNombreJuego] = useState(''); const [plataforma, setPlataforma] = useState(''); const [codigo, setCodigo] = useState(''); const [compatibles, setCompatibles] = useState<string[]>([]);
  const [error, setError] = useState(''); const [exito, setExito] = useState(''); const [carga, setCarga] = useState(true); const [ocupado, setOcupado] = useState('');
  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarga(true); setError('');
    try {
      const [e, p, j, pu, pa] = await Promise.all([api.get<Evento>(`/eventos/${id}`), api.get<Participante[]>(`/eventos/${id}/participantes`), api.get<Videojuego[]>('/videojuegos'), api.get<Puesto[]>(`/eventos/${id}/puestos`), api.get<Partida[]>(`/eventos/${id}/partidas`)]);
      setEvento(e); setParticipantes(p); setJuegos(j); setPuestos(pu); setPartidas(pa);
    } catch (x) { setError(errorTexto(x)); }
    finally { setCarga(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { void cargar(true); }, [cargar]));
  const ejecutar = async (clave: string, fn: () => Promise<unknown>, mensaje: string) => {
    setOcupado(clave); setError(''); setExito('');
    try { await fn(); setExito(mensaje); await cargar(true); }
    catch (x) { setError(errorTexto(x)); }
    finally { setOcupado(''); }
  };
  if (carga && !evento) return <Pantalla><Cargando texto="Cargando herramientas de anfitrión…" /></Pantalla>;
  if (!evento) return <Pantalla><Aviso mensaje={error || 'No se encontró la edición.'} /><Boton titulo="Reintentar" onPress={() => void cargar()} /></Pantalla>;
  const pendientes = partidas.filter(p => p.estado === 'EN_CURSO');
  return <Pantalla onActualizar={() => void cargar()} actualizando={carga}>
    <Cabecera ceja="GESTIÓN DE EDICIÓN" titulo="Panel de anfitrión" descripcion="Administra los recursos y el cierre de la competición." lado={<MaterialCommunityIcons name="shield-crown" color={tema.colores.primario} size={32} />} />
    <Tarjeta destacado>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Etiqueta>{estado(evento.estado)}</Etiqueta><MaterialCommunityIcons name="trophy-variant" color={tema.colores.primario} size={23} /></View>
      <Titulo pequeno>{evento.premio}</Titulo>
      <Secundario>Inicio · {fecha(evento.fechaInicio)}</Secundario><Secundario>Cierre · {fecha(evento.fechaCierreEnfrentamientos)}</Secundario>
      <View style={{ flexDirection: 'row', gap: 9 }}><Metrica valor={participantes.length} etiqueta="Participantes" icono="account-group" /><Metrica valor={puestos.length} etiqueta="Puestos" icono="gamepad-variant" /><Metrica valor={pendientes.length} etiqueta="Partidas activas" icono="sword-cross" /></View>
    </Tarjeta>
    {error ? <Aviso mensaje={error} /> : null}{exito ? <Aviso mensaje={exito} ok /> : null}
    <Seccion titulo="Control de la competición" />
    {evento.estado === 'BORRADOR' ? <Boton titulo="Iniciar edición" icono="play-circle" cargando={ocupado === 'iniciar'} onPress={() => void ejecutar('iniciar', () => api.post(`/eventos/${id}/iniciar`), 'Edición iniciada.')} /> : null}
    {evento.estado === 'EN_CURSO' ? <Boton titulo="Cerrar enfrentamientos" icono="stop-circle" secundario cargando={ocupado === 'cierre'} onPress={() => void ejecutar('cierre', () => api.post(`/eventos/${id}/cerrar-enfrentamientos`), 'Enfrentamientos cerrados.')} /> : null}
    <Seccion titulo="Emitir papeletas" detalle="Asignación administrativa a un participante." />
    <Tarjeta>
      {participantes.length === 0 ? <Secundario>Aún no hay participantes inscritos.</Secundario> : <View style={{ gap: 8 }}>{participantes.map(p => <Boton key={p.id} titulo={p.usuario?.nombreVisible || p.usuarioId} icono={participante === p.id ? 'radiobox-marked' : 'radiobox-blank'} compacto secundario={participante !== p.id} onPress={() => setParticipante(p.id)} />)}</View>}
      <Campo etiqueta="Cantidad (1 a 500)" value={cantidad} onChangeText={setCantidad} keyboardType="number-pad" />
      <Boton titulo="Emitir papeletas" icono="ticket-plus" cargando={ocupado === 'emitir'} deshabilitado={!participante} onPress={() => { const n = Number(cantidad); if (!Number.isInteger(n) || n < 1 || n > 500) { setError('Selecciona una cantidad entre 1 y 500.'); return; } void ejecutar('emitir', () => api.post(`/eventos/${id}/orla/emitir`, { participanteId: participante, cantidad: n }), 'Papeletas emitidas.'); }} />
    </Tarjeta>
    <Seccion titulo="Catálogo de videojuegos" detalle="Juegos disponibles en los puestos del torneo." />
    <Tarjeta>
      {juegos.length ? juegos.map(j => <View key={j.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><MaterialCommunityIcons name="gamepad-variant-outline" color={tema.colores.primario} size={18} /><View style={{ flex: 1 }}><Titulo pequeno>{j.nombre}</Titulo><Secundario>{j.plataforma || 'Plataforma no indicada'}</Secundario></View><Etiqueta tono={j.activo ? 'verde' : 'gris'}>{j.activo ? 'Activo' : 'Inactivo'}</Etiqueta></View>) : <Secundario>No hay videojuegos registrados.</Secundario>}
      <Campo etiqueta="Nombre del videojuego" value={nombreJuego} onChangeText={setNombreJuego} placeholder="Ej. Mario Kart" />
      <Campo etiqueta="Plataforma (opcional)" value={plataforma} onChangeText={setPlataforma} placeholder="Ej. Nintendo Switch" />
      <Boton titulo="Añadir videojuego" icono="plus" secundario cargando={ocupado === 'juego'} onPress={() => { if (nombreJuego.trim().length < 2) { setError('El nombre debe tener al menos 2 caracteres.'); return; } void ejecutar('juego', () => api.post('/videojuegos', { nombre: nombreJuego.trim(), plataforma: plataforma.trim() || undefined }), 'Videojuego añadido.'); setNombreJuego(''); setPlataforma(''); }} />
    </Tarjeta>
    <Seccion titulo="Puestos de juego" detalle="Asocia cada puesto a sus videojuegos compatibles." />
    <Tarjeta>
      {puestos.length ? puestos.map(p => <View key={p.id} style={{ gap: 4 }}><Titulo pequeno>{p.codigo}</Titulo><Secundario>{p.videojuegos?.map(j => j.nombre).join(' · ') || 'Sin compatibilidades indicadas'}</Secundario></View>) : <Secundario>No hay puestos configurados.</Secundario>}
      <Campo etiqueta="Código del puesto" value={codigo} onChangeText={setCodigo} placeholder="Ej. PUESTO 01" />
      <Secundario>Selecciona los videojuegos compatibles:</Secundario>
      <View style={{ gap: 8 }}>{juegos.map(j => <Boton key={j.id} titulo={j.nombre} compacto icono={compatibles.includes(j.id) ? 'checkbox-marked' : 'checkbox-blank-outline'} secundario={!compatibles.includes(j.id)} onPress={() => setCompatibles(actual => actual.includes(j.id) ? actual.filter(x => x !== j.id) : [...actual, j.id])} />)}</View>
      <Boton titulo="Crear puesto" icono="plus-box" secundario cargando={ocupado === 'puesto'} onPress={() => { if (!codigo.trim() || !compatibles.length) { setError('Indica un código y al menos un videojuego.'); return; } void ejecutar('puesto', () => api.post(`/eventos/${id}/puestos`, { codigo: codigo.trim(), videojuegosIds: compatibles }), 'Puesto creado.'); setCodigo(''); setCompatibles([]); }} />
    </Tarjeta>
    <Seccion titulo="Resultados de partidas" detalle="El anfitrión registra manualmente al ganador." />
    <Tarjeta>
      {pendientes.length === 0 ? <Secundario>No hay partidas pendientes de resultado.</Secundario> : pendientes.map(p => <View key={p.id} style={{ gap: 9, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: tema.colores.borde }}>
        <Etiqueta tono="amarillo">PARTIDA ACTIVA</Etiqueta><Titulo pequeno>Partida {p.id.slice(0, 8)}</Titulo>
        {[p.participanteAId, p.participanteBId].map(pid => <Boton key={pid} titulo={`Ganador: ${participantes.find(x => x.id === pid)?.usuario?.nombreVisible || pid.slice(0, 8)}`} compacto secundario cargando={ocupado === `partida-${p.id}`} onPress={() => void ejecutar(`partida-${p.id}`, () => api.post(`/eventos/${id}/partidas/${p.id}/finalizar`, { ganadorId: pid }), 'Resultado de partida registrado.')} />)}
      </View>)}
    </Tarjeta>
    <Seccion titulo="Cierre de orla y sorteo" detalle="El servidor comprueba las condiciones antes de ejecutar cada acción." />
    <Tarjeta>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><MaterialCommunityIcons name="ticket-confirmation" color={tema.colores.primario} size={20} /><Titulo pequeno>Orla</Titulo></View>
      <Secundario>{evento.orlaCerradaEn ? `Cerrada el ${fecha(evento.orlaCerradaEn)}` : 'Todavía está abierta.'}</Secundario>
      <Boton titulo="Cerrar orla" icono="lock" secundario deshabilitado={!!evento.orlaCerradaEn} cargando={ocupado === 'orla'} onPress={() => void ejecutar('orla', () => api.post(`/eventos/${id}/orla/cerrar`), 'Orla cerrada.')} />
      <View style={{ height: 1, backgroundColor: tema.colores.borde }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><MaterialCommunityIcons name="trophy-award" color={tema.colores.primario} size={20} /><Titulo pequeno>Sorteo</Titulo></View>
      <Secundario>El sorteo solo se puede realizar cuando se cumplen las condiciones de cierre.</Secundario>
      <Boton titulo="Realizar sorteo" icono="dice-multiple" deshabilitado={evento.estado === 'FINALIZADO'} cargando={ocupado === 'sorteo'} onPress={() => void ejecutar('sorteo', () => api.post(`/eventos/${id}/orla/sorteo`), 'Sorteo realizado.')} />
    </Tarjeta>
  </Pantalla>;
}
