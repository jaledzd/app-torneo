
import React, { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  Aviso,
  Cabecera,
  Cargando,
  Etiqueta,
  Metrica,
  Pantalla,
  Secundario,
  Seccion,
  Tarjeta,
  Titulo,
} from '../../../componentes/ui';

import { api } from '../../../servicios/api';
import type { Partida } from '../../../tipos';
import { errorTexto, fecha, estado } from '../../../utilidades/formato';
import { tema } from '../../../constantes/tema';

/** Historial de enfrentamientos de la edición. */
export default function Partidas() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [lista, setLista] = useState<Partida[]>([]);
  const [carga, setCarga] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarga(true);

    setError('');

    try {
      setLista(
        await api.get<Partida[]>(`/eventos/${id}/partidas`),
      );
    } catch (e) {
      setError(errorTexto(e));
    } finally {
      setCarga(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void cargar(true);
    }, [cargar]),
  );

  const activas = lista.filter(
    (partida) => partida.estado === 'EN_CURSO',
  ).length;

  return (
    <Pantalla
      onActualizar={() => void cargar()}
      actualizando={carga}
    >
      <Cabecera
        ceja="HISTORIAL DE COMPETICIÓN"
        titulo="Partidas"
        descripcion="Sigue los enfrentamientos y consulta quién se llevó cada victoria."
        lado={
          <MaterialCommunityIcons
            name="gamepad-variant"
            color={tema.colores.primario}
            size={32}
          />
        }
      />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Metrica
          valor={lista.length}
          etiqueta="Enfrentamientos"
          icono="sword-cross"
        />

        <Metrica
          valor={activas}
          etiqueta="En curso"
          icono="timer-sand"
        />
      </View>

      {error ? <Aviso mensaje={error} /> : null}

      <Seccion titulo="Registro de partidas" />

      {carga && lista.length === 0 ? (
        <Cargando />
      ) : lista.length === 0 ? (
        <Tarjeta style={{ alignItems: 'center' }}>
          <MaterialCommunityIcons
            name="controller-off"
            size={38}
            color={tema.colores.tenue}
          />

          <Titulo pequeno>Aún no hay partidas</Titulo>

          <Secundario style={{ textAlign: 'center' }}>
            Los enfrentamientos aparecerán cuando se acepten retos.
          </Secundario>
        </Tarjeta>
      ) : (
        lista.map((p) => (
          <Tarjeta key={p.id}>
            {/* Estado y fecha */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Etiqueta
                tono={p.estado === 'EN_CURSO' ? 'verde' : 'gris'}
              >
                {estado(p.estado)}
              </Etiqueta>

              <Secundario>
                {fecha(p.iniciadaEn)}
              </Secundario>
            </View>

            {/* Participantes */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 9,
              }}
            >
              <View style={{ flex: 1, gap: 3 }}>
                <Titulo pequeno>
                  {p.participanteA?.usuario?.nombreVisible || 'Jugador A'}
                </Titulo>

                <Secundario>Jugador A</Secundario>
              </View>

              <TextVs />

              <View
                style={{
                  flex: 1,
                  alignItems: 'flex-end',
                  gap: 3,
                }}
              >
                <Titulo pequeno>
                  {p.participanteB?.usuario?.nombreVisible || 'Jugador B'}
                </Titulo>

                <Secundario>Jugador B</Secundario>
              </View>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: tema.colores.borde,
              }}
            />

            {/* Resultado */}
            <View style={{ gap: 9 }}>
              {p.ganador ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <MaterialCommunityIcons
                    name="trophy"
                    color={tema.colores.primario}
                    size={19}
                  />

                  <Titulo pequeno>
                    Ganador: {p.ganador.usuario?.nombreVisible || 'No disponible'}
                  </Titulo>
                </View>
              ) : (
                <Secundario>
                  Pendiente de resultado
                </Secundario>
              )}

              {/* Videojuego */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <MaterialCommunityIcons
                  name="gamepad-variant"
                  color={tema.colores.tenue}
                  size={18}
                />

                <Secundario>
                  {p.videojuego?.nombre || 'Videojuego no disponible'}
                </Secundario>
              </View>

              {/* Puesto */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <MaterialCommunityIcons
                  name="monitor"
                  color={tema.colores.tenue}
                  size={18}
                />

                <Secundario>
                  {p.puesto?.codigo || 'Puesto no disponible'}
                </Secundario>
              </View>
            </View>
          </Tarjeta>
        ))
      )}
    </Pantalla>
  );
}

/** Separador visual entre los dos participantes de una partida. */
function TextVs() {
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#283D23',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MaterialCommunityIcons
        name="sword-cross"
        color={tema.colores.primario}
        size={18}
      />
    </View>
  );
}
