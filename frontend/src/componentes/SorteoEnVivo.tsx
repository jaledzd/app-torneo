import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../servicios/api';
import type { Sorteo } from '../tipos';
import { tema } from '../constantes/tema';

const DURACION_MS = 9000;
const CONFETI = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 37 + 7) % 96,
  top: (i * 23 + 3) % 76,
  giro: (i * 41) % 150,
  ancho: i % 3 === 0 ? 5 : 3,
  alto: i % 3 === 0 ? 15 : 10,
}));

/**
 * Escucha el resultado persistido de la edición y reproduce la misma secuencia
 * en todos los móviles. Las marcas temporales proceden del servidor.
 */
export function SorteoEnVivo({ eventoId }: { eventoId?: string }) {
  const [sorteo, setSorteo] = useState<Sorteo | null>(null);
  const [ahora, setAhora] = useState(Date.now());
  const [cerrado, setCerrado] = useState(false);
  const movimiento = useRef(new Animated.Value(0)).current;
  const sacudida = useRef(new Animated.Value(0)).current;
  const lluvia = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!eventoId) return;
    let activo = true;
    const consultar = async () => {
      try {
        const resultado = await api.get<Sorteo>(`/eventos/${eventoId}/orla/sorteo`);
        if (activo) {
          setSorteo(actual => actual?.id === resultado.id ? actual : resultado);
        }
      } catch {
        // Un 404 significa que aún no se ha realizado el sorteo.
      }
    };
    void consultar();
    const intervalo = setInterval(() => { void consultar(); }, 1000);
    return () => { activo = false; clearInterval(intervalo); };
  }, [eventoId]);

  useEffect(() => {
    if (!sorteo) return;
    const actualizar = () => setAhora(Date.now());
    actualizar();
    const intervalo = setInterval(actualizar, 80);
    return () => clearInterval(intervalo);
  }, [sorteo]);

  useEffect(() => {
    if (!sorteo) return;
    const animacion = Animated.loop(Animated.timing(lluvia, { toValue: 1, duration: 2200, easing: Easing.linear, useNativeDriver: true }));
    animacion.start();
    return () => animacion.stop();
  }, [sorteo, lluvia]);

  useEffect(() => {
    if (!sorteo) return;
    const inicio = new Date(sorteo.animacionInicioEn).getTime();
    const progreso = Math.max(0, Math.min(1, (ahora - inicio) / DURACION_MS));
    movimiento.setValue(progreso);
  }, [sorteo, ahora, movimiento]);

  useEffect(() => {
    if (!sorteo) return;
    const restante = new Date(sorteo.revelarEn).getTime() - Date.now();
    if (restante <= 0) {
      sacudida.stopAnimation();
      sacudida.setValue(0);
      return;
    }
    const animacion = Animated.loop(Animated.sequence([
      Animated.timing(sacudida, { toValue: 1, duration: 95, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(sacudida, { toValue: -1, duration: 95, easing: Easing.linear, useNativeDriver: true }),
    ]));
    animacion.start();
    const detener = setTimeout(() => {
      animacion.stop();
      Animated.timing(sacudida, { toValue: 0, duration: 350, useNativeDriver: true }).start();
    }, restante);
    return () => { clearTimeout(detener); animacion.stop(); };
  }, [sorteo, sacudida]);

  if (!sorteo || cerrado) return null;

  const inicio = new Date(sorteo.animacionInicioEn).getTime();
  const revelacion = new Date(sorteo.revelarEn).getTime();
  const progreso = Math.max(0, Math.min(1, (ahora - inicio) / Math.max(1, revelacion - inicio)));
  const revelado = ahora >= revelacion;
  const rotacion = sacudida.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-5deg', '0deg', '5deg'] });
  const escalaPapeleta = movimiento.interpolate({ inputRange: [0, 0.7, 0.86, 1], outputRange: [0.3, 0.3, 1.12, 1] });
  const opacidadPapeleta = movimiento.interpolate({ inputRange: [0, 0.72, 0.88, 1], outputRange: [0, 0, 1, 1] });

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => { if (revelado) setCerrado(true); }}>
      <View style={{ flex: 1, backgroundColor: 'rgba(3,7,5,0.97)', justifyContent: 'center', alignItems: 'center', padding: 22 }}>
        {CONFETI.map((pieza, i) => (
          <Animated.View key={i} pointerEvents="none" style={{ position: 'absolute', left: `${pieza.left}%`, top: `${pieza.top}%`, width: pieza.ancho, height: pieza.alto, borderRadius: 2, backgroundColor: i % 5 === 0 ? '#A7F432' : '#D6A843', opacity: lluvia.interpolate({ inputRange: [0, 0.12, 0.88, 1], outputRange: [0, 1, 1, 0] }), transform: [{ translateY: lluvia.interpolate({ inputRange: [0, 1], outputRange: [-35, 850] }) }, { rotate: `${pieza.giro}deg` }] }} />
        ))}

        <View style={{ width: '100%', maxWidth: 440, alignItems: 'center', gap: 20 }}>
          <Text style={{ color: tema.colores.primario, fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 3 }}>APUCHITORNEO · GRAN SORTEO</Text>
          <Text style={{ color: tema.colores.texto, fontFamily: 'Rajdhani_700Bold', fontSize: 34, textAlign: 'center' }}>{revelado ? '¡TENEMOS GANADOR!' : 'LA SUERTE ESTÁ ECHADA'}</Text>
          <Text style={{ color: tema.colores.secundario, fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center' }}>{revelado ? 'La Orla ha elegido al ganador de esta edición' : 'Las papeletas se están agitando en la Orla…'}</Text>

          <Animated.View style={{ width: 230, height: 220, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: rotacion }] }}>
            <View style={{ position: 'absolute', width: 205, height: 205, borderRadius: 103, borderWidth: 1, borderColor: '#A7F43255', backgroundColor: '#A7F4320D' }} />
            <View style={{ width: 170, height: 170, borderRadius: 85, borderWidth: 8, borderColor: '#456B4D', backgroundColor: '#121A15', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <View style={{ position: 'absolute', top: 22, width: 120, height: 2, backgroundColor: '#A7F432' }} />
              <MaterialCommunityIcons name={revelado ? 'trophy-award' : 'ticket-confirmation'} size={66} color={tema.colores.primario} />
              <Text style={{ color: tema.colores.texto, fontFamily: 'Rajdhani_700Bold', fontSize: 18, marginTop: 5 }}>APUCHI</Text>
            </View>
            <View style={{ position: 'absolute', bottom: 3, width: 120, height: 13, borderRadius: 10, backgroundColor: '#456B4D' }} />
          </Animated.View>

          <View style={{ height: 112, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={{ opacity: opacidadPapeleta, transform: [{ scale: escalaPapeleta }] }}>
              <View style={{ minWidth: 260, maxWidth: '100%', paddingHorizontal: 22, paddingVertical: 18, borderRadius: 17, borderWidth: 1, borderColor: '#D6A843', backgroundColor: '#1B2118', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="ticket-confirmation" color="#D6A843" size={25} />
                <Text style={{ color: '#D6A843', fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }}>PAPELETA GANADORA</Text>
                <Text numberOfLines={2} adjustsFontSizeToFit style={{ color: '#FFFFFF', fontFamily: 'Rajdhani_700Bold', fontSize: 29, textAlign: 'center' }}>{sorteo.participanteGanador.nombreVisible}</Text>
                <Text style={{ color: tema.colores.secundario, fontFamily: 'Inter_400Regular', fontSize: 11 }}>{sorteo.premio}</Text>
              </View>
            </Animated.View>
            {!revelado ? <Text style={{ color: tema.colores.secundario, fontFamily: 'Inter_500Medium', fontSize: 12 }}>Preparando la extracción…</Text> : null}
          </View>

          {revelado ? (
            <Pressable onPress={() => setCerrado(true)} style={{ marginTop: 10, minHeight: 50, paddingHorizontal: 28, borderRadius: 15, backgroundColor: tema.colores.primario, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: tema.colores.negro, fontFamily: 'Inter_700Bold', fontSize: 13 }}>CONTINUAR</Text>
            </Pressable>
          ) : (
            <View style={{ width: '82%', height: 4, borderRadius: 4, backgroundColor: tema.colores.borde, overflow: 'hidden' }}>
              <View style={{ width: `${Math.round(progreso * 100)}%`, height: 4, backgroundColor: tema.colores.primario }} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
