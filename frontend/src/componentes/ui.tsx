import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { tema } from '../constantes/tema';

/** Contenedor común: fondo oscuro, zonas seguras y desplazamiento vertical. */
export function Pantalla({ children, onActualizar, actualizando = false, sinDesplazamiento = false }: React.PropsWithChildren<{ onActualizar?: () => void; actualizando?: boolean; sinDesplazamiento?: boolean }>) {
  const contenido = <View style={s.contenido}>{children}</View>;
  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View pointerEvents="none" style={s.resplandor} />
      {sinDesplazamiento ? contenido : (
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={onActualizar ? <RefreshControl refreshing={actualizando} onRefresh={onActualizar} tintColor={tema.colores.primario} colors={[tema.colores.primario]} /> : undefined}
        >{contenido}</ScrollView>
      )}
    </SafeAreaView>
  );
}

/** Título de pantalla o de bloque. */
export function Titulo({ children, pequeno = false }: React.PropsWithChildren<{ pequeno?: boolean }>) {
  return <Text style={pequeno ? s.subtitulo : s.titulo}>{children}</Text>;
}

/** Texto auxiliar con contraste secundario. */
export function Secundario({ children, style }: React.PropsWithChildren<{ style?: object }>) {
  return <Text style={[s.secundario, style]}>{children}</Text>;
}

/** Etiqueta breve para estados y categorías. */
export function Etiqueta({ children, tono = 'verde' }: React.PropsWithChildren<{ tono?: 'verde' | 'gris' | 'amarillo' | 'rojo' }>) {
  const color = tono === 'verde' ? tema.colores.primario : tono === 'amarillo' ? tema.colores.aviso : tono === 'rojo' ? tema.colores.error : tema.colores.secundario;
  return <View style={[s.etiqueta, { borderColor: `${color}55`, backgroundColor: `${color}14` }]}><View style={[s.punto, { backgroundColor: color }]} /><Text style={[s.etiquetaTexto, { color }]}>{children}</Text></View>;
}

/** Panel visual para agrupar información relacionada, sin recargar la pantalla. */
export function Tarjeta({ children, estilo, destacado = false }: React.PropsWithChildren<{ estilo?: ViewStyle; destacado?: boolean }>) {
  return <View style={[s.tarjeta, destacado && s.tarjetaDestacada, estilo]}>{children}</View>;
}

/** Botón accesible con estados de pulsación, carga y variante secundaria. */
export function Boton({ titulo, onPress, secundario = false, deshabilitado = false, cargando = false, icono, peligro = false, compacto = false }: {
  titulo: string; onPress: () => void; secundario?: boolean; deshabilitado?: boolean; cargando?: boolean; icono?: keyof typeof MaterialCommunityIcons.glyphMap; peligro?: boolean; compacto?: boolean;
}) {
  const fondo = peligro ? '#3A1719' : secundario ? tema.colores.superficieAlta : tema.colores.primario;
  const texto = peligro ? tema.colores.error : secundario ? tema.colores.texto : tema.colores.negro;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: deshabilitado || cargando, busy: cargando }} onPress={onPress} disabled={deshabilitado || cargando}
      style={({ pressed }) => [s.boton, compacto && s.botonCompacto, { backgroundColor: fondo, borderColor: peligro ? '#713337' : secundario ? tema.colores.borde : tema.colores.primario, opacity: deshabilitado ? 0.42 : 1, transform: [{ translateY: pressed ? 2 : 0 }] }, pressed && !deshabilitado && s.botonPulsado, { borderBottomWidth: secundario ? 1 : 4, borderBottomColor: peligro ? '#241012' : secundario ? '#101710' : '#67991E' }, pressed && !deshabilitado ? { borderBottomWidth: 1 } : null]}>
      {cargando ? <ActivityIndicator color={texto} /> : <>{icono ? <MaterialCommunityIcons name={icono} size={18} color={texto} /> : null}<Text style={[s.botonTexto, { color: texto }]}>{titulo}</Text></>}
    </Pressable>
  );
}

/** Campo de formulario con etiqueta y estilo compartido. */
export function Campo({ etiqueta, ayuda, ...props }: { etiqueta: string; ayuda?: string } & TextInputProps) {
  return <View style={s.campoGrupo}><Text style={s.etiquetaCampo}>{etiqueta}</Text><TextInput placeholderTextColor={tema.colores.tenue} selectionColor={tema.colores.primario} style={s.input} {...props} />{ayuda ? <Text style={s.ayuda}>{ayuda}</Text> : null}</View>;
}

/** Mensaje de error, advertencia o confirmación. */
export function Aviso({ mensaje, ok = false }: { mensaje: string; ok?: boolean }) {
  const color = ok ? tema.colores.correcto : tema.colores.error;
  return <View accessibilityRole="alert" style={[s.aviso, { borderColor: `${color}70`, backgroundColor: `${color}12` }]}><MaterialCommunityIcons name={ok ? 'check-circle-outline' : 'alert-circle-outline'} color={color} size={20} /><Text style={[s.avisoTexto, { color }]}>{mensaje}</Text></View>;
}

/** Indicador de carga reutilizable. */
export function Cargando({ texto = 'Preparando la arena…' }: { texto?: string }) {
  return <View style={s.cargando}><ActivityIndicator size="large" color={tema.colores.primario} /><Text style={s.ayuda}>{texto}</Text></View>;
}

/** Cabecera editorial de una pantalla. */
export function Cabecera({ ceja, titulo, descripcion, lado }: { ceja?: string; titulo: string; descripcion?: string; lado?: React.ReactNode }) {
  return <View style={s.cabecera}><View style={{ flex: 1, gap: 5 }}>{ceja ? <Text style={s.ceja}>{ceja}</Text> : null}<Text style={s.titulo}>{titulo}</Text>{descripcion ? <Text style={s.secundario}>{descripcion}</Text> : null}</View>{lado}</View>;
}

/** Encabezado compacto de sección. */
export function Seccion({ titulo, detalle, lado }: { titulo: string; detalle?: string; lado?: React.ReactNode }) {
  return <View style={s.seccion}><View style={{ flex: 1, gap: 3 }}><Text style={s.subtitulo}>{titulo}</Text>{detalle ? <Text style={s.ayuda}>{detalle}</Text> : null}</View>{lado}</View>;
}

/** Indicador numérico para saldos, contadores y estadísticas. */
export function Metrica({ valor, etiqueta, icono }: { valor: string | number; etiqueta: string; icono?: keyof typeof MaterialCommunityIcons.glyphMap }) {
  return <View style={s.metrica}>{icono ? <MaterialCommunityIcons name={icono} size={18} color={tema.colores.primario} /> : null}<Text style={s.metricaValor}>{valor}</Text><Text style={s.metricaEtiqueta}>{etiqueta}</Text></View>;
}

/** Urna animada de la orla. La animación es decorativa y respeta reducir movimiento. */
export function UrnaAnimada({ papeletas = 0, resultado = false }: { papeletas?: number; resultado?: boolean }) {
  const giro = useRef(new Animated.Value(0)).current;
  const [movimientoReducido, setMovimientoReducido] = useState(false);
  useEffect(() => {
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled().then(valor => { if (vivo) setMovimientoReducido(valor); }).catch(() => undefined);
    const suscripcion = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setMovimientoReducido);
    return () => { vivo = false; suscripcion?.remove(); };
  }, []);
  useEffect(() => {
    if (movimientoReducido || resultado) { giro.stopAnimation(); giro.setValue(0); return; }
    const animacion = Animated.loop(Animated.sequence([
      Animated.timing(giro, { toValue: 1, duration: 1700, useNativeDriver: true }),
      Animated.timing(giro, { toValue: -1, duration: 1700, useNativeDriver: true }),
      Animated.timing(giro, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]));
    animacion.start();
    return () => animacion.stop();
  }, [giro, movimientoReducido, resultado, papeletas]);
  const rotacion = giro.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-4deg', '0deg', '4deg'] });
  return (
    <View style={s.urnaZona}>
      <View style={s.urnaHalo} />
      <Animated.View style={[s.urna, { transform: [{ rotate: rotacion }] }]}>
        <View style={s.urnaTapa}><View style={s.urnaRanura} /></View>
        <View style={s.urnaCuerpo}>
          <View style={s.papeletas}><View style={[s.papeleta, { transform: [{ rotate: '-20deg' }] }]} /><View style={[s.papeleta, { transform: [{ rotate: '12deg' }] }]} /><View style={[s.papeleta, { transform: [{ rotate: '35deg' }] }]} /></View>
          <MaterialCommunityIcons name={resultado ? 'trophy' : 'ticket-confirmation'} size={42} color={tema.colores.primario} />
          <Text style={s.urnaMarca}>APUCHI</Text>
        </View>
        <View style={s.urnaBase} />
      </Animated.View>
      <Text style={s.urnaContador}>{resultado ? 'SORTEO REALIZADO' : `${papeletas} ${papeletas === 1 ? 'PAPELETA' : 'PAPELETAS'} EN LA ORLA`}</Text>
    </View>
  );
}

/** Icono Material Community reutilizable para elementos secundarios. */
export function Icono({ nombre, color = tema.colores.secundario, size = 20 }: { nombre: keyof typeof MaterialCommunityIcons.glyphMap; color?: string; size?: number }) {
  return <MaterialCommunityIcons name={nombre} color={color} size={size} />;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tema.colores.fondo },
  resplandor: { position: 'absolute', top: -100, right: -100, width: 260, height: 260, borderRadius: 130, backgroundColor: '#24451E', opacity: 0.12 },
  scroll: { flexGrow: 1, paddingBottom: 36 },
  contenido: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, gap: 17 },
  titulo: { color: tema.colores.texto, fontFamily: 'Rajdhani_700Bold', fontSize: 34, lineHeight: 39 },
  subtitulo: { color: tema.colores.texto, fontFamily: 'Rajdhani_700Bold', fontSize: 23, lineHeight: 28 },
  secundario: { color: tema.colores.secundario, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  tarjeta: { backgroundColor: tema.colores.superficie, borderWidth: 1, borderColor: tema.colores.borde, borderRadius: tema.radio.grande, padding: 17, gap: 12 },
  tarjetaDestacada: { borderColor: tema.colores.bordeActivo, backgroundColor: '#142018' },
  boton: { minHeight: 52, paddingHorizontal: 18, paddingVertical: 13, borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  botonCompacto: { minHeight: 40, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12 },
  botonPulsado: { opacity: 0.9 },
  botonTexto: { fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 0.1 },
  campoGrupo: { gap: 7 },
  etiquetaCampo: { color: tema.colores.texto, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  input: { minHeight: 52, color: tema.colores.texto, backgroundColor: tema.colores.fondoElevado, borderColor: tema.colores.borde, borderWidth: 1, borderRadius: 14, paddingHorizontal: 15, paddingVertical: 12, fontFamily: 'Inter_400Regular', fontSize: 14 },
  ayuda: { color: tema.colores.tenue, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17 },
  aviso: { borderWidth: 1, borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avisoTexto: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18 },
  cargando: { paddingVertical: 38, alignItems: 'center', gap: 12 },
  etiqueta: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 7, borderWidth: 1, borderRadius: 999 },
  punto: { width: 6, height: 6, borderRadius: 3 },
  etiquetaTexto: { fontFamily: 'Inter_700Bold', fontSize: 10 },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ceja: { color: tema.colores.primario, fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase' },
  seccion: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 5 },
  metrica: { flex: 1, minWidth: 0, backgroundColor: tema.colores.superficie, borderWidth: 1, borderColor: tema.colores.borde, borderRadius: 16, padding: 13, gap: 4 },
  metricaValor: { color: tema.colores.texto, fontFamily: 'Rajdhani_700Bold', fontSize: 27 },
  metricaEtiqueta: { color: tema.colores.secundario, fontFamily: 'Inter_500Medium', fontSize: 10 },
  urnaZona: { minHeight: 235, alignItems: 'center', justifyContent: 'center', backgroundColor: '#101912', borderRadius: 24, borderWidth: 1, borderColor: '#304B32', overflow: 'hidden', paddingVertical: 17, gap: 10 },
  urnaHalo: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: '#8AEF2B', opacity: 0.07 },
  urna: { alignItems: 'center', width: 158 },
  urnaTapa: { width: 126, height: 25, backgroundColor: '#6EAC35', borderWidth: 2, borderColor: '#B6F56B', borderRadius: 10, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  urnaRanura: { width: 44, height: 5, backgroundColor: '#172016', borderRadius: 3 },
  urnaCuerpo: { width: 150, height: 145, marginTop: -2, backgroundColor: '#1B2D20', borderWidth: 2, borderColor: '#8ACB4D', borderRadius: 22, alignItems: 'center', justifyContent: 'center', gap: 4, overflow: 'hidden' },
  urnaMarca: { color: '#B7E78B', fontFamily: 'Rajdhani_700Bold', fontSize: 13, letterSpacing: 2 },
  papeletas: { position: 'absolute', top: 10, right: 16, flexDirection: 'row', gap: 2 },
  papeleta: { width: 14, height: 22, backgroundColor: tema.colores.primario, borderRadius: 2 },
  urnaBase: { width: 168, height: 10, borderRadius: 5, backgroundColor: '#527B35', marginTop: -2 },
  urnaContador: { color: tema.colores.primario, fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.3 },
});
