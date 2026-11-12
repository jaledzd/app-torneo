import React, { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Aviso, Boton, Cabecera, Campo, Etiqueta, Metrica, Pantalla, Secundario, Seccion, Tarjeta, Titulo, UrnaAnimada } from '../../../componentes/ui';
import { api } from '../../../servicios/api';
import type { Cartera, Sorteo } from '../../../tipos';
import { errorTexto, fecha } from '../../../utilidades/formato';
import { tema } from '../../../constantes/tema';

/** Cartera de papeletas, depósito en la orla y consulta del resultado del sorteo. */
export default function Orla() {
  const { id } = useLocalSearchParams<{ id: string }>(); const [cartera, setCartera] = useState<Cartera>({ cartera: 0, orla: 0 }); const [cantidad, setCantidad] = useState('1'); const [sorteo, setSorteo] = useState<Sorteo | null>(null);
  const [error, setError] = useState(''); const [exito, setExito] = useState(''); const [carga, setCarga] = useState(true); const [depositando, setDepositando] = useState(false);
  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarga(true); setError('');
    try {
      const c = await api.get<Cartera>(`/eventos/${id}/orla/mi-cartera`); setCartera(c);
      try { setSorteo(await api.get<Sorteo>(`/eventos/${id}/orla/sorteo`)); } catch { setSorteo(null); }
    } catch (e) { setError(errorTexto(e)); }
    finally { setCarga(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { void cargar(true); }, [cargar]));
  const depositar = async () => {
    const n = Number(cantidad); if (!Number.isInteger(n) || n < 1) { setError('Indica una cantidad entera mayor que cero.'); return; }
    if (n > cartera.cartera) { setError('No tienes tantas papeletas en tu cartera.'); return; }
    setDepositando(true); setError(''); setExito('');
    try { await api.post(`/eventos/${id}/orla/depositar`, { cantidad: n }); setExito('Papeletas depositadas en la orla.'); await cargar(true); }
    catch (e) { setError(errorTexto(e)); }
    finally { setDepositando(false); }
  };
  return <Pantalla onActualizar={() => void cargar()} actualizando={carga}>
    <Cabecera ceja="EL MOMENTO DEL SORTEO" titulo="La orla" descripcion="Tus papeletas pueden acercarte al premio de esta edición." lado={<MaterialCommunityIcons name="ticket-confirmation" color={tema.colores.primario} size={32} />} />
    <UrnaAnimada papeletas={cartera.orla} resultado={!!sorteo} />
    <View style={{ flexDirection: 'row', gap: 10 }}><Metrica valor={cartera.cartera} etiqueta="En tu cartera" icono="wallet-outline" /><Metrica valor={cartera.orla} etiqueta="En la orla" icono="ticket-confirmation" /></View>
    {error ? <Aviso mensaje={error} /> : null}{exito ? <Aviso mensaje={exito} ok /> : null}
    <Seccion titulo="Depositar papeletas" detalle="Decide cuántas quieres añadir a la orla." />
    <Tarjeta>
      <Campo etiqueta="Cantidad a depositar" value={cantidad} onChangeText={setCantidad} keyboardType="number-pad" />
      <Secundario>Las papeletas que no deposites permanecen en tu cartera.</Secundario>
      <Boton titulo="Depositar en la orla" icono="ticket-confirmation" onPress={() => void depositar()} cargando={depositando} deshabilitado={carga || cartera.cartera === 0 || !!sorteo} />
      {cartera.cartera === 0 ? <Secundario>No tienes papeletas disponibles para depositar.</Secundario> : null}
    </Tarjeta>
    <Seccion titulo="Resultado del sorteo" />
    {sorteo ? <Tarjeta destacado>
      <Etiqueta tono="verde">SORTEO REALIZADO</Etiqueta>
      <MaterialCommunityIcons name="trophy-award" color={tema.colores.primario} size={42} />
      <Titulo>{sorteo.premio}</Titulo>
      <Secundario>Participante ganador · {sorteo.participanteGanadorId}</Secundario>
      <Secundario>Realizado · {fecha(sorteo.realizadoEn)}</Secundario>
    </Tarjeta> : <Tarjeta>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><MaterialCommunityIcons name="gift-outline" color={tema.colores.primario} size={23} /><Titulo pequeno>El premio espera a su ganador</Titulo></View>
      <Secundario>El resultado aparecerá aquí cuando el anfitrión cierre la orla y realice el sorteo.</Secundario>
    </Tarjeta>}
  </Pantalla>;
}
