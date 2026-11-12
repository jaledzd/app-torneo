import React, { useState } from 'react';
import { router } from 'expo-router';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Aviso, Boton, Cabecera, Campo, Etiqueta, Pantalla, Secundario, Tarjeta, Titulo } from '../componentes/ui';
import { api } from '../servicios/api';
import { errorTexto } from '../utilidades/formato';
import { tema } from '../constantes/tema';

type CampoFecha = 'inicio-fecha' | 'inicio-hora' | 'cierre-fecha' | 'cierre-hora' | null;

/** Formulario de creación de una edición en estado BORRADOR. */
export default function CrearEvento() {
  const [inicio, setInicio] = useState<Date | null>(null); const [cierre, setCierre] = useState<Date | null>(null);
  const [selector, setSelector] = useState<CampoFecha>(null); const [minutos, setMinutos] = useState('30'); const [premio, setPremio] = useState('');
  const [error, setError] = useState(''); const [ocupado, setOcupado] = useState(false);
  /** Muestra la fecha elegida con el formato local del dispositivo. */
  const fechaTexto = (valor: Date | null) => valor ? new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }).format(valor) : 'Seleccionar fecha';
  /** Muestra la hora elegida con el formato local del dispositivo. */
  const horaTexto = (valor: Date | null) => valor ? new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(valor) : 'Seleccionar hora';

  /** Actualiza la parte de fecha u hora elegida sin perder la otra parte. */
  const cambiarFecha = (campo: Exclude<CampoFecha, null>, valor: Date) => {
    const actualizar = (anterior: Date | null) => {
      const nuevo = anterior ? new Date(anterior) : new Date(valor);
      if (campo.endsWith('fecha')) nuevo.setFullYear(valor.getFullYear(), valor.getMonth(), valor.getDate());
      else nuevo.setHours(valor.getHours(), valor.getMinutes(), 0, 0);
      if (!anterior && campo.endsWith('fecha')) nuevo.setHours(10, 0, 0, 0);
      return nuevo;
    };
    if (campo.startsWith('inicio')) setInicio(actualizar);
    else setCierre(actualizar);
  };

  /** Recibe la selección nativa y cierra el selector tras confirmar o cancelar. */
  const alCambiarSelector = (evento: DateTimePickerEvent, valor?: Date) => {
    if (evento.type === 'set' && valor && selector) cambiarFecha(selector, valor);
    if (evento.type === 'set' || evento.type === 'dismissed') setSelector(null);
  };

  const guardar = async () => {
    if (!inicio || !cierre) return setError('Selecciona la fecha y la hora de inicio y cierre.');
    if (cierre <= inicio) return setError('El cierre debe ser posterior al inicio.');
    if (!Number.isInteger(+minutos) || +minutos < 1 || !premio.trim()) return setError('Revisa la duración del periodo adicional y el premio.');
    setOcupado(true); setError('');
    try {
      const e = await api.post<{ id: string }>('/eventos', { fechaInicio: inicio.toISOString(), fechaCierreEnfrentamientos: cierre.toISOString(), duracionPeriodoAdicionalMinutos: +minutos, premio: premio.trim() });
      router.replace(`/evento/${e.id}`);
    } catch (x) { setError(errorTexto(x)); } finally { setOcupado(false); }
  };

  /** Construye un control accesible para abrir el selector nativo de fecha u hora. */
  const selectorFecha = (campo: Exclude<CampoFecha, null>, etiqueta: string, valor: Date | null, tipo: 'date' | 'time') => (
    <View style={{ flex: 1, gap: 7 }}>
      <Text style={{ color: tema.colores.texto, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>{etiqueta}</Text>
      <Pressable accessibilityRole="button" onPress={() => setSelector(campo)} style={({ pressed }) => ({ minHeight: 49, paddingHorizontal: 11, borderRadius: 13, borderWidth: 1, borderColor: selector === campo ? tema.colores.primario : tema.colores.borde, backgroundColor: tema.colores.fondoElevado, flexDirection: 'row', alignItems: 'center', gap: 7, opacity: pressed ? 0.8 : 1 })}>
        <MaterialCommunityIcons name={tipo === 'date' ? 'calendar' : 'clock-outline'} color={tema.colores.primario} size={17} />
        <Text numberOfLines={1} style={{ flex: 1, color: valor ? tema.colores.texto : tema.colores.tenue, fontFamily: 'Inter_500Medium', fontSize: 11 }}>{tipo === 'date' ? fechaTexto(valor) : horaTexto(valor)}</Text>
      </Pressable>
    </View>
  );

  const valorPicker = selector?.startsWith('inicio') ? inicio : cierre;
  const tipoPicker = selector?.endsWith('fecha') ? 'date' : 'time';
  return <Pantalla>
    <Cabecera ceja="PANEL DE ANFITRIÓN" titulo="Crear edición" descripcion="Prepara una nueva competición. Podrás completar la configuración desde su panel." />
    <Tarjeta destacado><Etiqueta>ESTADO INICIAL · BORRADOR</Etiqueta><Secundario>La cuenta autenticada quedará asociada como anfitrión responsable de esta edición.</Secundario></Tarjeta>
    <Titulo pequeno>Calendario del torneo</Titulo>
    <Tarjeta>
      <Titulo pequeno>Inicio</Titulo>
      <View style={{ flexDirection: 'row', gap: 9 }}>{selectorFecha('inicio-fecha', 'Fecha', inicio, 'date')}{selectorFecha('inicio-hora', 'Hora', inicio, 'time')}</View>
      <View style={{ height: 1, backgroundColor: tema.colores.borde }} />
      <Titulo pequeno>Cierre de enfrentamientos</Titulo>
      <View style={{ flexDirection: 'row', gap: 9 }}>{selectorFecha('cierre-fecha', 'Fecha', cierre, 'date')}{selectorFecha('cierre-hora', 'Hora', cierre, 'time')}</View>
    </Tarjeta>
    {selector && valorPicker ? <DateTimePicker value={valorPicker} mode={tipoPicker} display={Platform.OS === 'ios' ? 'spinner' : 'default'} minimumDate={selector.startsWith('inicio') ? new Date() : inicio || undefined} onChange={alCambiarSelector} /> : selector ? <DateTimePicker value={new Date()} mode={tipoPicker} display={Platform.OS === 'ios' ? 'spinner' : 'default'} minimumDate={selector.startsWith('inicio') ? new Date() : inicio || undefined} onChange={alCambiarSelector} /> : null}
    <Titulo pequeno>Reglas de cierre</Titulo>
    <Campo etiqueta="Periodo adicional (minutos)" value={minutos} onChangeText={setMinutos} keyboardType="number-pad" />
    <Campo etiqueta="Premio de la edición" placeholder="Ej. Mando inalámbrico" value={premio} onChangeText={setPremio} maxLength={250} />
    {error ? <Aviso mensaje={error} /> : null}
    <Boton titulo="Crear edición" icono="plus-circle" onPress={guardar} cargando={ocupado} />
    <Secundario style={{ textAlign: 'center' }}>Las fechas se envían al servidor en formato ISO 8601 con conversión automática de zona horaria.</Secundario>
  </Pantalla>;
}
