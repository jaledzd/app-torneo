
import React, { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  Aviso,
  Boton,
  Cabecera,
  Cargando,
  Etiqueta,
  Pantalla,
  Secundario,
  Seccion,
  Tarjeta,
  Titulo,
} from '../../../componentes/ui';

import { api } from '../../../servicios/api';
import type { Disponible, Reto } from '../../../tipos';
import { errorTexto, fecha } from '../../../utilidades/formato';
import { tema } from '../../../constantes/tema';

/** Bandeja de retos recibidos y envío de nuevos desafíos. */
export default function Retos() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [retos, setRetos] = useState<Reto[]>([]);
  const [jugadores, setJugadores] = useState<Disponible[]>([]);
  const [error, setError] = useState('');
  const [carga, setCarga] = useState(true);
  const [ocupado, setOcupado] = useState('');

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarga(true);

    setError('');

    try {
      const [r, j] = await Promise.all([
        api.get<Reto[]>(`/eventos/${id}/retos/recibidos`),
        api.get<Disponible[]>(
          `/eventos/${id}/participantes/disponibles`,
        ),
      ]);

      setRetos(r);
      setJugadores(j);
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

  const accion = async (
    clave: string,
    ruta: string,
    cuerpo?: unknown,
  ) => {
    setOcupado(clave);
    setError('');

    try {
      await api.post(ruta, cuerpo);
      await cargar(true);
    } catch (e) {
      setError(errorTexto(e));
    } finally {
      setOcupado('');
    }
  };

  if (carga && !retos.length && !jugadores.length) {
    return (
      <Pantalla>
        <Cargando texto="Buscando jugadores y retos…" />
      </Pantalla>
    );
  }

  return (
    <Pantalla
      onActualizar={() => void cargar()}
      actualizando={carga}
    >
      <Cabecera
        ceja="ZONA DE DESAFÍOS"
        titulo="Retos"
        descripcion="Lanza un desafío o responde a quien te ha retado."
        lado={
          <MaterialCommunityIcons
            name="sword-cross"
            color={tema.colores.primario}
            size={32}
          />
        }
      />

      {error ? <Aviso mensaje={error} /> : null}

      <Seccion
        titulo="Retos recibidos"
        detalle={`${retos.length} solicitudes en tu bandeja`}
      />

      {retos.length === 0 ? (
        <Tarjeta style={{ alignItems: 'center' }}>
          <MaterialCommunityIcons
            name="email-open-outline"
            color={tema.colores.tenue}
            size={36}
          />

          <Titulo pequeno>
            No tienes retos pendientes
          </Titulo>

          <Secundario style={{ textAlign: 'center' }}>
            Cuando otro participante te desafíe, aparecerá aquí.
          </Secundario>
        </Tarjeta>
      ) : (
        retos.map((r) => (
          <Tarjeta key={r.id} destacado>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Etiqueta tono="amarillo">
                NUEVO RETO
              </Etiqueta>

              <Secundario>
                Caduca · {fecha(r.caducaEn)}
              </Secundario>
            </View>

            <Titulo pequeno>
              {r.emisor?.usuario?.nombreVisible ||
                'Un participante te ha retado'}
            </Titulo>

            <Secundario>
              ¿Aceptas el enfrentamiento?
            </Secundario>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                padding: 13,
                backgroundColor: tema.colores.superficie,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: tema.colores.borde,
              }}
            >
              <MaterialCommunityIcons
                name="dice-multiple"
                color={tema.colores.primario}
                size={27}
              />

              <View style={{ flex: 1 }}>
                <Titulo pequeno>
                  Asignación aleatoria
                </Titulo>

                <Secundario>
                  Al aceptar, el sistema elegirá automáticamente
                  un puesto libre y un videojuego compatible.
                </Secundario>
              </View>
            </View>

            <Boton
              titulo="Aceptar reto"
              icono="check-circle"
              cargando={ocupado === `aceptar-${r.id}`}
              deshabilitado={ocupado !== ''}
              onPress={() =>
                void accion(
                  `aceptar-${r.id}`,
                  `/eventos/${id}/retos/${r.id}/aceptar`,
                )
              }
            />

            <Boton
              titulo="Rechazar reto"
              icono="close-circle-outline"
              secundario
              peligro
              cargando={ocupado === `rechazar-${r.id}`}
              deshabilitado={ocupado !== ''}
              onPress={() =>
                void accion(
                  `rechazar-${r.id}`,
                  `/eventos/${id}/retos/${r.id}/rechazar`,
                )
              }
            />
          </Tarjeta>
        ))
      )}

      <Seccion
        titulo="Jugadores disponibles"
        detalle="Participantes que pueden recibir un desafío ahora."
      />

      {jugadores.length === 0 ? (
        <Tarjeta>
          <Secundario>
            No hay jugadores disponibles en este momento.
          </Secundario>
        </Tarjeta>
      ) : (
        jugadores.map((j) => (
          <View
            key={j.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 13,
              backgroundColor: tema.colores.superficie,
              borderColor: tema.colores.borde,
              borderWidth: 1,
              borderRadius: 17,
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: '#253A23',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons
                name="account"
                color={tema.colores.primario}
                size={23}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Titulo pequeno>
                {j.nombreVisible}
              </Titulo>

              <Secundario>
                Disponible
              </Secundario>
            </View>

            <Boton
              titulo="Retar"
              compacto
              icono="sword"
              cargando={ocupado === `enviar-${j.id}`}
              deshabilitado={ocupado !== ''}
              onPress={() =>
                void accion(
                  `enviar-${j.id}`,
                  `/eventos/${id}/retos`,
                  { destinatarioId: j.id },
                )
              }
            />
          </View>
        ))
      )}
    </Pantalla>
  );
}
