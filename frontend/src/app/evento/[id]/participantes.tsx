import React, { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Aviso, Cabecera, Cargando, Etiqueta, Metrica, Pantalla, Secundario, Seccion, Tarjeta, Titulo } from '../../../componentes/ui';
import { api } from '../../../servicios/api';
import type { Participante } from '../../../tipos';
import { errorTexto } from '../../../utilidades/formato';
import { tema } from '../../../constantes/tema';

/** Directorio de participantes de la edición. El backend limita quién puede consultarlo. */
export default function Participantes() {
  const { id } = useLocalSearchParams<{ id: string }>(); const [lista, setLista] = useState<Participante[]>([]); const [carga, setCarga] = useState(true); const [error, setError] = useState('');
  const cargar = useCallback(async (silencioso = false) => { if (!silencioso) setCarga(true); setError(''); try { setLista(await api.get<Participante[]>(`/eventos/${id}/participantes`)); } catch (e) { setError(errorTexto(e)); } finally { setCarga(false); } }, [id]);
  useFocusEffect(useCallback(() => { void cargar(true); }, [cargar]));
  return <Pantalla onActualizar={() => void cargar()} actualizando={carga}>
    <Cabecera ceja="COMUNIDAD DE LA EDICIÓN" titulo="Participantes" descripcion="Jugadores inscritos en esta competición." lado={<MaterialCommunityIcons name="account-group" color={tema.colores.primario} size={32} />} />
    <Metrica valor={lista.length} etiqueta="Participantes inscritos" icono="account-multiple" />
    {error ? <Aviso mensaje={error} /> : null}
    <Seccion titulo="Lista de jugadores" />
    {carga && lista.length === 0 ? <Cargando /> : lista.length === 0 ? <Tarjeta><Secundario>No hay participantes disponibles para mostrar.</Secundario></Tarjeta> : lista.map((p, i) => <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: tema.colores.superficie, borderWidth: 1, borderColor: tema.colores.borde, borderRadius: 17 }}>
      <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: '#253A23', alignItems: 'center', justifyContent: 'center' }}><Titulo pequeno>{(p.usuario?.nombreVisible || '?').slice(0, 1).toUpperCase()}</Titulo></View>
      <View style={{ flex: 1, gap: 3 }}><Titulo pequeno>{p.usuario?.nombreVisible || `Jugador ${i + 1}`}</Titulo><Secundario>{p.usuario?.email || 'Correo no disponible'}</Secundario></View>
      <Etiqueta tono={p.estado === 'ACTIVO' ? 'verde' : 'gris'}>{p.estado}</Etiqueta>
    </View>)}
  </Pantalla>;
}
