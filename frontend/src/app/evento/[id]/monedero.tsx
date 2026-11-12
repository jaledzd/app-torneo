
import React, { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Aviso,
  Cabecera,
  Cargando,
  Pantalla,
  Secundario,
  Seccion,
  Tarjeta,
  Titulo,
} from '../../../componentes/ui';
import { api } from '../../../servicios/api';
import type { Movimiento } from '../../../tipos';
import { errorTexto, fecha } from '../../../utilidades/formato';
import { tema } from '../../../constantes/tema';

export default function Monedero() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [saldo, setSaldo] = useState(0);
  const [movs, setMovs] = useState<Movimiento[]>([]);
  const [carga, setCarga] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarga(true);
    setError('');

    try {
      const [s, m] = await Promise.all([
        api.get<{ saldo: number }>(
          `/eventos/${id}/apuchicoins/mi-saldo`,
        ),
        api.get<Movimiento[]>(
          `/eventos/${id}/apuchicoins/mis-movimientos`,
        ),
      ]);

      setSaldo(s.saldo);
      setMovs(m);
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

  return (
    <Pantalla
      onActualizar={() => void cargar()}
      actualizando={carga}
    >
      <Cabecera
        ceja="RECOMPENSAS DE JUEGO"
        titulo="ApuchiCoins"
        descripcion="Tu rendimiento también suma recompensas."
        lado={
          <MaterialCommunityIcons
            name="cash-multiple"
            color={tema.colores.primario}
            size={32}
          />
        }
      />

      <Tarjeta
        destacado
        style={{
          alignItems: 'center',
          paddingVertical: 25,
          gap: 7,
        }}
      >
        <MaterialCommunityIcons
          name="alpha-a-circle"
          size={38}
          color={tema.colores.primario}
        />

        <Titulo>{saldo}</Titulo>

        <Secundario>APUCHICOINS DISPONIBLES</Secundario>

        <Secundario style={{ textAlign: 'center' }}>
          El ganador de cada partida recibe una ApuchiCoin.
        </Secundario>
      </Tarjeta>

      {error ? <Aviso mensaje={error} /> : null}

      <Seccion
        titulo="Historial de movimientos"
        detalle={`${movs.length} movimientos registrados`}
      />

      {carga && movs.length === 0 ? (
        <Cargando />
      ) : movs.length === 0 ? (
        <Tarjeta style={{ alignItems: 'center' }}>
          <MaterialCommunityIcons
            name="receipt-text-outline"
            size={34}
            color={tema.colores.tenue}
          />

          <Titulo pequeno>
            Sin movimientos todavía
          </Titulo>

          <Secundario>
            Cuando consigas tu primera recompensa, aparecerá aquí.
          </Secundario>
        </Tarjeta>
      ) : (
        movs.map((m) => {
          const descripcion =
            m.descripcion?.trim() ||
            (m.motivo === 'VICTORIA_PARTIDA'
              ? 'Victoria de partida'
              : m.motivo);

          return (
            <View
              key={m.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                backgroundColor: tema.colores.superficie,
                borderWidth: 1,
                borderColor: tema.colores.borde,
                borderRadius: 16,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 13,
                  backgroundColor: '#203921',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons
                  name="plus"
                  color={tema.colores.correcto}
                  size={23}
                />
              </View>

              <View style={{ flex: 1, gap: 3 }}>
                <Titulo pequeno>
                  {descripcion}
                </Titulo>

                <Secundario>
                  {fecha(m.creadoEn)}
                </Secundario>
              </View>

              <Titulo pequeno>
                +{m.cantidad}
              </Titulo>
            </View>
          );
        })
      )}
    </Pantalla>
  );
}
