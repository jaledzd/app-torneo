
import React, { useCallback, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Alert, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  Aviso,
  Boton,
  Cabecera,
  Campo,
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

import type {
  Evento,
  Participante,
  Videojuego,
  Puesto,
  Partida,
} from '../../../tipos';

import { errorTexto, fecha, estado } from '../../../utilidades/formato';
import { tema } from '../../../constantes/tema';

type SeccionPanel =
  | 'resumen'
  | 'papeletas'
  | 'participantes'
  | 'videojuegos'
  | 'puestos'
  | 'resultados'
  | 'sorteo';

/** Panel de gestión de una edición para su anfitrión o administrador. */
export default function PanelAnfitrion() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [juegos, setJuegos] = useState<Videojuego[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [codigoAcceso, setCodigoAcceso] = useState('');

  const [participante, setParticipante] = useState('');
  const [cantidad, setCantidad] = useState('1');

  const [nombreJuego, setNombreJuego] = useState('');
  const [plataforma, setPlataforma] = useState('');
  const [codigo, setCodigo] = useState('');
  const [compatibles, setCompatibles] = useState<string[]>([]);

  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [carga, setCarga] = useState(true);
  const [ocupado, setOcupado] = useState('');

  const [seccionActiva, setSeccionActiva] =
    useState<SeccionPanel>('resumen');

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarga(true);
    setError('');

    try {
      const [e, p, j, pu, pa, codigo] = await Promise.all([
        api.get<Evento>(`/eventos/${id}`),
        api.get<Participante[]>(`/eventos/${id}/participantes`),
        api.get<Videojuego[]>('/videojuegos'),
        api.get<Puesto[]>(`/eventos/${id}/puestos`),
        api.get<Partida[]>(`/eventos/${id}/partidas`),
        api.get<{ codigo: string }>(`/eventos/${id}/codigo-acceso`),
      ]);

      setEvento(e);
      setParticipantes(p);
      setJuegos(j);
      setPuestos(pu);
      setPartidas(pa);
      setCodigoAcceso(codigo.codigo);
    } catch (x) {
      setError(errorTexto(x));
    } finally {
      setCarga(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void cargar(true);
    }, [cargar]),
  );

  const validarCantidadVisual = (valor: string): boolean => {
    const n = Number(valor);
    return Number.isInteger(n) && n >= 1 && n <= 500;
  };

  const ejecutar = async (
    clave: string,
    fn: () => Promise<unknown>,
    mensaje: string,
  ) => {
    setOcupado(clave);
    setError('');
    setExito('');

    try {
      await fn();
      setExito(mensaje);
      await cargar(true);
    } catch (x) {
      setError(errorTexto(x));
    } finally {
      setOcupado('');
    }
  };

  if (carga && !evento) {
    return (
      <Pantalla>
        <Cargando texto="Cargando herramientas de anfitrión…" />
      </Pantalla>
    );
  }

  if (!evento) {
    return (
      <Pantalla>
        <Aviso mensaje={error || 'No se encontró la edición.'} />
        <Boton titulo="Reintentar" onPress={() => void cargar()} />
      </Pantalla>
    );
  }

  const pendientes = partidas.filter(
    (p) => p.estado === 'EN_CURSO',
  );

  const costeTotal = Number(cantidad) > 0
    ? Number(cantidad) * 3
    : 0;

  const participanteSeleccionado = participantes.find(
    (p) => p.id === participante,
  );

  const saldoDisponible = Number(
    participanteSeleccionado?.saldoApuchiCoins ?? 0,
  );

  const saldoInsuficiente = saldoDisponible < costeTotal;

  const validarCantidad = () => {
    const n = Number(cantidad);

    if (!Number.isInteger(n) || n < 1 || n > 500) {
      setError('Selecciona una cantidad entre 1 y 500.');
      return null;
    }

    return n;
  };

  const venderPapeletas = () => {
    const n = validarCantidad();
    if (n === null) return;

    if (!participante) {
      setError('Selecciona un participante.');
      return;
    }

    void ejecutar(
      'emitir',
      () =>
        api.post(`/eventos/${id}/orla/emitir`, {
          participanteId: participante,
          cantidad: n,
        }),
      'Papeletas vendidas y monedas descontadas.',
    );
  };

  const regalarPapeletas = () => {
    const n = validarCantidad();
    if (n === null) return;

    if (!participante) {
      setError('Selecciona un participante.');
      return;
    }

    void ejecutar(
      'regalar',
      () =>
        api.post(`/eventos/${id}/orla/regalar`, {
          participanteId: participante,
          cantidad: n,
        }),
      'Papeletas regaladas correctamente.',
    );
  };

  const confirmarEliminar = () => {
    if (ocupado !== '') return;

    Alert.alert(
      'Eliminar edición definitivamente',
      'Se eliminarán el torneo y todos sus datos: participantes, partidas, retos, puestos, papeletas, sorteos y movimientos de ApuchiCoins. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar definitivamente',
          style: 'destructive',
          onPress: () => {
            setOcupado('eliminar');
            setError('');
            setExito('');

            void (async () => {
              try {
                await api.delete(`/eventos/${id}`);
                router.replace('/(tabs)');
              } catch (x) {
                setError(errorTexto(x));
                setOcupado('');
              }
            })();
          },
        },
      ],
    );
  };

  const navegar = (seccion: SeccionPanel) => {
    setSeccionActiva(seccion);
    setError('');
    setExito('');
  };

  return (
    <Pantalla
      onActualizar={() => void cargar()}
      actualizando={carga}
    >
      <Cabecera
        ceja="GESTIÓN DE EDICIÓN"
        titulo="Panel de anfitrión"
        descripcion="Administra los recursos y el cierre de la competición."
        lado={
          <MaterialCommunityIcons
            name="shield-crown"
            color={tema.colores.primario}
            size={32}
          />
        }
      />

      {/* RESUMEN PERMANENTE */}

      <Tarjeta destacado>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Etiqueta>{estado(evento.estado)}</Etiqueta>

          <MaterialCommunityIcons
            name="trophy-variant"
            color={tema.colores.primario}
            size={23}
          />
        </View>

        <Titulo pequeno>{evento.premio}</Titulo>

        <Secundario>
          Inicio · {fecha(evento.fechaInicio)}
        </Secundario>

        <Secundario>
          Cierre · {fecha(evento.fechaCierreEnfrentamientos)}
        </Secundario>

        <View style={{ flexDirection: 'row', gap: 9 }}>
          <Metrica
            valor={participantes.length}
            etiqueta="Participantes"
            icono="account-group"
          />

          <Metrica
            valor={puestos.length}
            etiqueta="Puestos"
            icono="gamepad-variant"
          />

          <Metrica
            valor={pendientes.length}
            etiqueta="Partidas activas"
            icono="sword-cross"
          />
        </View>
      </Tarjeta>

      {/* MENSAJES */}

      {error ? <Aviso mensaje={error} /> : null}
      {exito ? <Aviso mensaje={exito} ok /> : null}

      {/* NAVEGACIÓN */}

      <Seccion
        titulo="Herramientas de gestión"
        detalle="Selecciona el apartado que quieres administrar."
      />

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <Boton
          titulo="Resumen"
          icono="view-dashboard"
          compacto
          secundario={seccionActiva !== 'resumen'}
          onPress={() => navegar('resumen')}
        />

        <Boton
          titulo="Papeletas"
          icono="ticket"
          compacto
          secundario={seccionActiva !== 'papeletas'}
          onPress={() => navegar('papeletas')}
        />

        <Boton
          titulo="Participantes"
          icono="account-group"
          compacto
          secundario={seccionActiva !== 'participantes'}
          onPress={() => navegar('participantes')}
        />

        <Boton
          titulo="Videojuegos"
          icono="gamepad-variant"
          compacto
          secundario={seccionActiva !== 'videojuegos'}
          onPress={() => navegar('videojuegos')}
        />

        <Boton
          titulo="Puestos"
          icono="monitor"
          compacto
          secundario={seccionActiva !== 'puestos'}
          onPress={() => navegar('puestos')}
        />

        <Boton
          titulo="Resultados"
          icono="trophy"
          compacto
          secundario={seccionActiva !== 'resultados'}
          onPress={() => navegar('resultados')}
        />

        <Boton
          titulo="Sorteo"
          icono="dice-multiple"
          compacto
          secundario={seccionActiva !== 'sorteo'}
          onPress={() => navegar('sorteo')}
        />
      </View>

      {/* RESUMEN Y CONTROL DE LA COMPETICIÓN */}

      {seccionActiva === 'resumen' && (
        <>
          <Seccion titulo="Acceso de participantes" detalle="Comparte este código solo con las personas que quieras admitir en la edición." />
          <Tarjeta estilo={{ gap: 12 }}>
            <Etiqueta tono="verde">CÓDIGO PRIVADO</Etiqueta>
            <Titulo grande>{codigoAcceso || '------'}</Titulo>
            <Secundario>Solo el anfitrión puede consultar este código. Los jugadores lo necesitan para apuntarse.</Secundario>
            <Boton titulo="Regenerar código" icono="refresh" secundario deshabilitado={ocupado !== ''} cargando={ocupado === 'codigo'} onPress={() => void ejecutar('codigo', async () => {
              const respuesta = await api.post<{ codigo: string }>(`/eventos/${id}/codigo-acceso/regenerar`);
              setCodigoAcceso(respuesta.codigo);
            }, 'Código de acceso regenerado. El anterior ya no es válido.')} />
          </Tarjeta>

          <Seccion
            titulo="Control de la competición"
            detalle="Gestiona el estado general de la edición."
          />

          <Tarjeta>
            {evento.estado === 'BORRADOR' ? (
              <Boton
                titulo="Iniciar edición"
                icono="play-circle"
                cargando={ocupado === 'iniciar'}
                deshabilitado={ocupado !== ''}
                onPress={() =>
                  void ejecutar(
                    'iniciar',
                    () => api.post(`/eventos/${id}/iniciar`),
                    'Edición iniciada.',
                  )
                }
              />
            ) : null}

            {evento.estado === 'EN_CURSO' ? (
              <Boton
                titulo="Cerrar enfrentamientos"
                icono="stop-circle"
                secundario
                cargando={ocupado === 'cierre'}
                deshabilitado={ocupado !== ''}
                onPress={() =>
                  void ejecutar(
                    'cierre',
                    () =>
                      api.post(
                        `/eventos/${id}/cerrar-enfrentamientos`,
                      ),
                    'Enfrentamientos cerrados.',
                  )
                }
              />
            ) : null}

            <Titulo pequeno>Estado de las partidas</Titulo>

            <Secundario>
              {pendientes.length
                ? `Hay ${pendientes.length} partidas pendientes de resultado.`
                : 'No hay partidas pendientes de resultado.'}
            </Secundario>

            {pendientes.length > 0 ? (
              <Boton
                titulo="Gestionar resultados"
                icono="trophy"
                onPress={() => navegar('resultados')}
              />
            ) : null}
          </Tarjeta>

          <Seccion
            titulo="Zona peligrosa"
            detalle="La eliminación es permanente y no se puede recuperar."
          />

          <Tarjeta>
            <Titulo pequeno>Eliminar esta edición</Titulo>
            <Secundario>
              Se borrarán todos los datos vinculados a este torneo,
              incluidos los movimientos de ApuchiCoins. Los videojuegos
              del catálogo general no se eliminarán.
            </Secundario>
            <Boton
              titulo="Eliminar torneo definitivamente"
              icono="delete-forever"
              secundario
              cargando={ocupado === 'eliminar'}
              deshabilitado={ocupado !== ''}
              onPress={confirmarEliminar}
            />
          </Tarjeta>
        </>
      )}

      {/* PARTICIPANTES */}
      {seccionActiva === 'participantes' && (
        <>
          <Seccion
            titulo="Gestión de participantes"
            detalle="Consulta los jugadores inscritos y retira a quienes ya no deban formar parte de esta edición."
          />

          {participantes.length === 0 ? (
            <Tarjeta>
              <Secundario>No hay participantes inscritos en esta edición.</Secundario>
            </Tarjeta>
          ) : (
            <View style={{ gap: 10 }}>
              {participantes.map((p) => {
                const nombre = p.usuario?.nombreVisible || 'Jugador';
                const tienePartidaActiva = partidas.some(
                  (partida) =>
                    partida.estado === 'EN_CURSO' &&
                    (partida.participanteAId === p.id || partida.participanteBId === p.id),
                );

                return (
                  <Tarjeta key={p.id} estilo={{ gap: 11 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ flex: 1, gap: 3 }}>
                        <Titulo pequeno>{nombre}</Titulo>
                        <Secundario>{p.usuario?.email || 'Correo no disponible'}</Secundario>
                      </View>
                      <Etiqueta tono={tienePartidaActiva ? 'amarillo' : 'verde'}>
                        {tienePartidaActiva ? 'PARTIDA ACTIVA' : 'INSCRITO'}
                      </Etiqueta>
                    </View>
                    <Boton
                      titulo="Expulsar participante"
                      icono="account-remove"
                      peligro
                      compacto
                      deshabilitado={ocupado !== '' || tienePartidaActiva}
                      cargando={ocupado === 'retirar-' + p.id}
                      onPress={() => {
                        Alert.alert(
                          'Expulsar participante',
                          '¿Seguro que quieres retirar a ' + nombre + ' de esta edición? Se conservará su cuenta y el historial de partidas.',
                          [
                            { text: 'Cancelar', style: 'cancel' },
                            {
                              text: 'Expulsar',
                              style: 'destructive',
                              onPress: () => {
                                void ejecutar(
                                  'retirar-' + p.id,
                                  () => api.delete('/eventos/' + id + '/participantes/' + p.id),
                                  nombre + ' ha sido retirado de la edición.',
                                );
                              },
                            },
                          ],
                        );
                      }}
                    />
                    {tienePartidaActiva ? (
                      <Secundario>No se puede expulsar mientras tenga una partida en curso. Cuando finalice, podrás volver a intentarlo.</Secundario>
                    ) : null}
                  </Tarjeta>
                );
              })}
            </View>
          )}
        </>
      )}

      {/* PAPELETAS */}

      {seccionActiva === 'papeletas' && (
        <>
          <Seccion
            titulo="Venta y regalo de papeletas"
            detalle="Cada papeleta cuesta 3 ApuchiCoins. También puedes regalarlas."
          />

          <Tarjeta>
            <Etiqueta tono="amarillo">
              3 APUCHICOINS POR PAPELETA
            </Etiqueta>

            {participantes.length === 0 ? (
              <Secundario>
                Aún no hay participantes inscritos.
              </Secundario>
            ) : (
              <View style={{ gap: 8 }}>
                <Secundario>
                  Selecciona al participante:
                </Secundario>

                {participantes.map((p) => (
                  <Boton
                    key={p.id}
                    titulo={
                      p.usuario?.nombreVisible || p.usuarioId
                    }
                    icono={
                      participante === p.id
                        ? 'radiobox-marked'
                        : 'radiobox-blank'
                    }
                    compacto
                    secundario={participante !== p.id}
                    deshabilitado={ocupado !== ''}
                    onPress={() => setParticipante(p.id)}
                  />
                ))}
              </View>
            )}

            <Campo
              etiqueta="Cantidad de papeletas"
              value={cantidad}
              onChangeText={setCantidad}
              keyboardType="number-pad"
            />

            <Secundario>
              Saldo del participante: {saldoDisponible} ApuchiCoins
            </Secundario>

            <Secundario>
              Coste de la venta: {costeTotal} ApuchiCoins
            </Secundario>

            {saldoInsuficiente && participanteSeleccionado ? (
              <Aviso mensaje="Este participante no tiene suficientes ApuchiCoins para comprar estas papeletas." />
            ) : null}

            <Boton
              titulo="Vender papeletas"
              icono="cash"
              cargando={ocupado === 'emitir'}
              deshabilitado={
                !participante ||
                ocupado !== '' ||
                !validarCantidadVisual(cantidad) ||
                saldoInsuficiente
              }
              onPress={venderPapeletas}
            />

            <Boton
              titulo="Regalar papeletas"
              icono="gift"
              secundario
              cargando={ocupado === 'regalar'}
              deshabilitado={
                !participante ||
                ocupado !== '' ||
                !validarCantidadVisual(cantidad)
              }
              onPress={regalarPapeletas}
            />
          </Tarjeta>
        </>
      )}

      {/* VIDEOJUEGOS */}

      {seccionActiva === 'videojuegos' && (
        <>
          <Seccion
            titulo="Catálogo de videojuegos"
            detalle="Juegos disponibles en los puestos del torneo."
          />

          <Tarjeta>
            {juegos.length ? (
              juegos.map((j) => (
                <View
                  key={j.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 9,
                  }}
                >
                  <MaterialCommunityIcons
                    name="gamepad-variant-outline"
                    color={tema.colores.primario}
                    size={18}
                  />

                  <View style={{ flex: 1 }}>
                    <Titulo pequeno>{j.nombre}</Titulo>
                    <Secundario>
                      {j.plataforma || 'Plataforma no indicada'}
                    </Secundario>
                  </View>

                  <Etiqueta tono={j.activo ? 'verde' : 'gris'}>
                    {j.activo ? 'Activo' : 'Inactivo'}
                  </Etiqueta>
                </View>
              ))
            ) : (
              <Secundario>
                No hay videojuegos registrados.
              </Secundario>
            )}

            <Campo
              etiqueta="Nombre del videojuego"
              value={nombreJuego}
              onChangeText={setNombreJuego}
              placeholder="Ej. Mario Kart"
            />

            <Campo
              etiqueta="Plataforma (opcional)"
              value={plataforma}
              onChangeText={setPlataforma}
              placeholder="Ej. Nintendo Switch"
            />

            <Boton
              titulo="Añadir videojuego"
              icono="plus"
              secundario
              cargando={ocupado === 'juego'}
              deshabilitado={ocupado !== ''}
              onPress={() => {
                if (nombreJuego.trim().length < 2) {
                  setError(
                    'El nombre debe tener al menos 2 caracteres.',
                  );
                  return;
                }

                void ejecutar(
                  'juego',
                  () =>
                    api.post('/videojuegos', {
                      nombre: nombreJuego.trim(),
                      plataforma: plataforma.trim() || undefined,
                    }),
                  'Videojuego añadido.',
                );

                setNombreJuego('');
                setPlataforma('');
              }}
            />
          </Tarjeta>
        </>
      )}

      {/* PUESTOS */}

      {seccionActiva === 'puestos' && (
        <>
          <Seccion
            titulo="Puestos de juego"
            detalle="Asocia cada puesto a sus videojuegos compatibles."
          />

          <Tarjeta>
            {puestos.length ? (
              puestos.map((p) => (
                <View key={p.id} style={{ gap: 4 }}>
                  <Titulo pequeno>{p.codigo}</Titulo>

                  <Secundario>
                    {p.videojuegos?.map((j) => j.nombre).join(' · ')
                      || 'Sin compatibilidades indicadas'}
                  </Secundario>
                </View>
              ))
            ) : (
              <Secundario>
                No hay puestos configurados.
              </Secundario>
            )}

            <Campo
              etiqueta="Código del puesto"
              value={codigo}
              onChangeText={setCodigo}
              placeholder="Ej. PUESTO 01"
            />

            <Secundario>
              Selecciona los videojuegos compatibles:
            </Secundario>

            <View style={{ gap: 8 }}>
              {juegos.map((j) => (
                <Boton
                  key={j.id}
                  titulo={j.nombre}
                  compacto
                  icono={
                    compatibles.includes(j.id)
                      ? 'checkbox-marked'
                      : 'checkbox-blank-outline'
                  }
                  secundario={!compatibles.includes(j.id)}
                  deshabilitado={ocupado !== ''}
                  onPress={() =>
                    setCompatibles((actual) =>
                      actual.includes(j.id)
                        ? actual.filter((x) => x !== j.id)
                        : [...actual, j.id],
                    )
                  }
                />
              ))}
            </View>

            <Boton
              titulo="Crear puesto"
              icono="plus-box"
              secundario
              cargando={ocupado === 'puesto'}
              deshabilitado={ocupado !== ''}
              onPress={() => {
                if (!codigo.trim() || !compatibles.length) {
                  setError(
                    'Indica un código y al menos un videojuego.',
                  );
                  return;
                }

                void ejecutar(
                  'puesto',
                  () =>
                    api.post(`/eventos/${id}/puestos`, {
                      codigo: codigo.trim(),
                      videojuegosIds: compatibles,
                    }),
                  'Puesto creado.',
                );

                setCodigo('');
                setCompatibles([]);
              }}
            />
          </Tarjeta>
        </>
      )}

      {/* RESULTADOS */}

      {seccionActiva === 'resultados' && (
        <>
          <Seccion
            titulo="Resultados de partidas"
            detalle="Selecciona al participante ganador de cada enfrentamiento."
          />

          <Tarjeta>
            {pendientes.length === 0 ? (
              <Secundario>
                No hay partidas pendientes de resultado.
              </Secundario>
            ) : (
              pendientes.map((p) => (
                <View
                  key={p.id}
                  style={{
                    gap: 9,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: tema.colores.borde,
                  }}
                >
                  <Etiqueta tono="amarillo">
                    PARTIDA ACTIVA
                  </Etiqueta>

                  <Titulo pequeno>
                    Partida {p.id.slice(0, 8)}
                  </Titulo>

                  <Secundario>
                    Selecciona al ganador:
                  </Secundario>

                  {[p.participanteAId, p.participanteBId].map(
                    (pid) => (
                      <Boton
                        key={pid}
                        titulo={`Ganador: ${
                          participantes.find((x) => x.id === pid)
                            ?.usuario?.nombreVisible || pid.slice(0, 8)
                        }`}
                        compacto
                        secundario
                        cargando={ocupado === `partida-${p.id}`}
                        deshabilitado={ocupado !== ''}
                        onPress={() =>
                          void ejecutar(
                            `partida-${p.id}`,
                            () =>
                              api.post(
                                `/eventos/${id}/partidas/${p.id}/finalizar`,
                                { ganadorId: pid },
                              ),
                            'Resultado de partida registrado.',
                          )
                        }
                      />
                    ),
                  )}
                </View>
              ))
            )}
          </Tarjeta>
        </>
      )}

      {/* SORTEO */}

      {seccionActiva === 'sorteo' && (
        <>
          <Seccion
            titulo="Cierre de orla y sorteo"
            detalle="El servidor comprueba las condiciones antes de ejecutar cada acción."
          />

          <Tarjeta>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <MaterialCommunityIcons
                name="ticket-confirmation"
                color={tema.colores.primario}
                size={20}
              />

              <Titulo pequeno>Orla</Titulo>
            </View>

            <Secundario>
              {evento.orlaCerradaEn
                ? `Cerrada el ${fecha(evento.orlaCerradaEn)}`
                : 'Todavía está abierta.'}
            </Secundario>

            <Boton
              titulo="Cerrar orla"
              icono="lock"
              secundario
              deshabilitado={!!evento.orlaCerradaEn || ocupado !== ''}
              cargando={ocupado === 'orla'}
              onPress={() =>
                void ejecutar(
                  'orla',
                  () => api.post(`/eventos/${id}/orla/cerrar`),
                  'Orla cerrada.',
                )
              }
            />

            <View
              style={{
                height: 1,
                backgroundColor: tema.colores.borde,
              }}
            />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <MaterialCommunityIcons
                name="trophy-award"
                color={tema.colores.primario}
                size={20}
              />

              <Titulo pequeno>Sorteo</Titulo>
            </View>

            <Secundario>
              El sorteo solo se puede realizar cuando se cumplen
              las condiciones de cierre.
            </Secundario>

            <Boton
              titulo="Realizar sorteo"
              icono="dice-multiple"
              deshabilitado={
                evento.estado === 'FINALIZADO' || ocupado !== ''
              }
              cargando={ocupado === 'sorteo'}
              onPress={() =>
                void ejecutar(
                  'sorteo',
                  () => api.post(`/eventos/${id}/orla/sorteo`),
                  'Sorteo realizado.',
                )
              }
            />
          </Tarjeta>
        </>
      )}
    </Pantalla>
  );
}
