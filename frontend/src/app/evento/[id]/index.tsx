import React, { useCallback, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
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
import type { Evento, Participante, PartidaActiva } from '../../../tipos';
import { errorTexto, fecha, estado } from '../../../utilidades/formato';
import { useAuth } from '../../../contextos/AuthContext';
import { tema } from '../../../constantes/tema';

type SeccionPanel = 'resumen' | 'competicion';
type MenuRapido = 'monedero' | 'orla' | null;

/** Portada de la edición y panel de navegación del participante/anfitrión. */
export default function Detalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario } = useAuth();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [inscrito, setInscrito] = useState(false);
  const [partidaActiva, setPartidaActiva] = useState<PartidaActiva | null>(null);
  const [seccionActiva, setSeccionActiva] = useState<SeccionPanel>('resumen');
  const [menuRapido, setMenuRapido] = useState<MenuRapido>(null);
  const [carga, setCarga] = useState(true);
  const [error, setError] = useState('');
  const [errorPartida, setErrorPartida] = useState('');
  const [inscribiendo, setInscribiendo] = useState(false);

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarga(true);
    setError('');
    setErrorPartida('');

    try {
      const e = await api.get<Evento>('/eventos/' + id);
      setEvento(e);

      try {
        await api.get<Participante>('/eventos/' + id + '/participantes/yo');
        setInscrito(true);
      } catch {
        setInscrito(false);
      }
    } catch (e) {
      setError(errorTexto(e));
    }

    try {
      const partidas = await api.get<PartidaActiva[]>('/partidas/mis-activas');
      setPartidaActiva(partidas.find((partida) => partida.eventoId === id) ?? null);
    } catch (e) {
      setErrorPartida(errorTexto(e));
    } finally {
      setCarga(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void cargar(true);
      const intervalo = setInterval(() => {
        void cargar(true);
      }, 15000);

      return () => clearInterval(intervalo);
    }, [cargar]),
  );

  const anfitrion = !!evento && (
    usuario?.rol === 'ADMINISTRADOR' || evento.anfitrionId === usuario?.id
  );

  const inscribir = async () => {
    setInscribiendo(true);
    setError('');
    try {
      await api.post('/eventos/' + id + '/participantes/inscribirme');
      setInscrito(true);
    } catch (e) {
      setError(errorTexto(e));
    } finally {
      setInscribiendo(false);
    }
  };

  const abrirModulo = (ruta: string) => {
    setMenuRapido(null);
    router.push(ruta as never);
  };

  if (carga && !evento) {
    return (
      <Pantalla>
        <Cargando texto="Cargando la edición…" />
      </Pantalla>
    );
  }

  if (!evento) {
    return (
      <Pantalla>
        <Aviso mensaje={error || 'No se ha encontrado la edición.'} />
        <Boton titulo="Volver a intentar" onPress={() => void cargar()} />
      </Pantalla>
    );
  }

  const tono = evento.estado === 'EN_CURSO'
    ? 'verde'
    : evento.estado === 'PERIODO_ADICIONAL'
      ? 'amarillo'
      : 'gris';

  const menuVisible = menuRapido !== null;
  const tituloMenu = menuRapido === 'monedero' ? 'ApuchiCoins' : 'Orla y sorteo';
  const descripcionMenu = menuRapido === 'monedero'
    ? 'Consulta tu saldo y todos tus movimientos de esta edición.'
    : 'Consulta tus papeletas, deposítalas en la orla y revisa el resultado del sorteo.';

  return (
    <Pantalla onActualizar={() => void cargar()} actualizando={carga}>
      <Cabecera
        ceja="EDICIÓN APUCHITORNEO"
        titulo={evento.premio}
        descripcion={evento.anfitrion?.nombreVisible
          ? 'Organiza ' + evento.anfitrion.nombreVisible
          : 'Tu espacio de competición.'}
        lado={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <AccesoRapido
              icono="alpha-a-circle"
              etiqueta="ApuchiCoins"
              onPress={() => setMenuRapido('monedero')}
            />
            <AccesoRapido
              icono="ticket-confirmation"
              etiqueta="Orla"
              onPress={() => setMenuRapido('orla')}
            />
          </View>
        }
      />

      <Tarjeta destacado estilo={{ padding: 18, gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Etiqueta tono={tono}>{estado(evento.estado)}</Etiqueta>
          <MaterialCommunityIcons name="trophy-variant" color={tema.colores.primario} size={26} />
        </View>

        <View style={{ gap: 7 }}>
          <DatoEvento icono="calendar-start" texto={'Inicio · ' + fecha(evento.fechaInicio)} />
          <DatoEvento icono="calendar-end" texto={'Cierre · ' + fecha(evento.fechaCierreEnfrentamientos)} />
        </View>

        {!inscrito && !anfitrion ? (
          <Boton
            titulo="Inscribirme en la edición"
            icono="account-plus"
            onPress={() => void inscribir()}
            cargando={inscribiendo}
          />
        ) : (
          <Etiqueta>{anfitrion ? 'PANEL DE ANFITRIÓN DISPONIBLE' : 'ESTÁS INSCRITO'}</Etiqueta>
        )}
      </Tarjeta>

      {error ? <Aviso mensaje={error} /> : null}
      {errorPartida ? <Aviso mensaje={'No se pudo consultar tu partida activa: ' + errorPartida} /> : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Boton
          titulo="Resumen"
          icono="view-dashboard"
          compacto
          secundario={seccionActiva !== 'resumen'}
          onPress={() => setSeccionActiva('resumen')}
        />
        <Boton
          titulo="Competición"
          icono="sword-cross"
          compacto
          secundario={seccionActiva !== 'competicion'}
          onPress={() => setSeccionActiva('competicion')}
        />
      </View>

      {seccionActiva === 'resumen' ? (
        <>
          {partidaActiva ? (
            <>
              <Seccion
                titulo="Tu partida activa"
                detalle="Este enfrentamiento desaparecerá de aquí cuando finalice."
                lado={<MaterialCommunityIcons name="sword-cross" color={tema.colores.primario} size={22} />}
              />
              <Tarjeta destacado estilo={{ padding: 17, gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Etiqueta tono="verde">EN CURSO</Etiqueta>
                  <MaterialCommunityIcons name="controller-classic" color={tema.colores.primario} size={25} />
                </View>
                <Titulo>{partidaActiva.videojuego.nombre}</Titulo>
                <DatoPartida icono="account-outline" etiqueta="Tu rival" valor={partidaActiva.rival.nombreVisible} />
                <DatoPartida icono="gamepad-variant-outline" etiqueta="Plataforma" valor={partidaActiva.videojuego.plataforma || 'No especificada'} />
                <DatoPartida
                  icono="monitor"
                  etiqueta="Puesto asignado"
                  valor={partidaActiva.puesto.codigo + (partidaActiva.puesto.descripcion ? ' · ' + partidaActiva.puesto.descripcion : '')}
                />
                <DatoPartida icono="clock-outline" etiqueta="Inicio" valor={fecha(partidaActiva.iniciadaEn)} />
                <Boton
                  titulo="Consultar historial de partidas"
                  icono="arrow-right"
                  secundario
                  onPress={() => abrirModulo('/evento/' + id + '/partidas')}
                />
              </Tarjeta>
            </>
          ) : null}

          <Seccion titulo="Zona de competición" detalle="Accede a los apartados principales de esta edición." />
          <Tarjeta estilo={{ gap: 12 }}>
            <ModuloCompacto
              nombre="Retos"
              detalle="Desafía a otros jugadores o responde a tus solicitudes."
              icono="sword-cross"
              onPress={() => abrirModulo('/evento/' + id + '/retos')}
            />
            <ModuloCompacto
              nombre="Partidas e historial"
              detalle="Consulta los enfrentamientos y sus resultados."
              icono="controller-classic"
              onPress={() => abrirModulo('/evento/' + id + '/partidas')}
            />
          </Tarjeta>

          {anfitrion ? (
            <Boton
              titulo="Abrir panel de anfitrión"
              icono="shield-crown"
              onPress={() => abrirModulo('/evento/' + id + '/anfitrion')}
            />
          ) : null}
        </>
      ) : null}

      {seccionActiva === 'competicion' ? (
        <>
          <Seccion titulo="Zona de competición" detalle="Retos, enfrentamientos y resultados." />
          <ModuloGrande
            nombre="Retos"
            detalle="Lanza desafíos a otros participantes y gestiona los que recibas."
            icono="sword-cross"
            onPress={() => abrirModulo('/evento/' + id + '/retos')}
          />
          <ModuloGrande
            nombre="Partidas e historial"
            detalle="Consulta todas las partidas de esta edición, incluidas las finalizadas."
            icono="controller-classic"
            onPress={() => abrirModulo('/evento/' + id + '/partidas')}
          />
        </>
      ) : null}

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuRapido(null)}
      >
        <Pressable
          onPress={() => setMenuRapido(null)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.62)',
            justifyContent: 'flex-start',
            alignItems: 'flex-end',
            paddingTop: 100,
            paddingHorizontal: 18,
          }}
        >
          <Pressable
            onPress={() => undefined}
            style={{
              width: '100%',
              maxWidth: 340,
              backgroundColor: tema.colores.superficie,
              borderColor: tema.colores.borde,
              borderWidth: 1,
              borderRadius: 22,
              padding: 18,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Titulo pequeno>{tituloMenu}</Titulo>
              <Pressable onPress={() => setMenuRapido(null)} hitSlop={10}>
                <MaterialCommunityIcons name="close" color={tema.colores.texto} size={22} />
              </Pressable>
            </View>
            <Secundario>{descripcionMenu}</Secundario>
            <Boton
              titulo={menuRapido === 'monedero' ? 'Abrir ApuchiCoins' : 'Abrir Orla y sorteo'}
              icono="arrow-right"
              onPress={() => abrirModulo(menuRapido === 'monedero'
                ? '/evento/' + id + '/monedero'
                : '/evento/' + id + '/orla')}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </Pantalla>
  );
}

function AccesoRapido({
  icono,
  etiqueta,
  onPress,
}: {
  icono: keyof typeof MaterialCommunityIcons.glyphMap;
  etiqueta: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={onPress}
      style={{
        width: 43,
        height: 43,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: tema.colores.borde,
        backgroundColor: tema.colores.superficie,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MaterialCommunityIcons name={icono} color={tema.colores.primario} size={24} />
    </Pressable>
  );
}

function DatoEvento({ icono, texto }: { icono: keyof typeof MaterialCommunityIcons.glyphMap; texto: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <MaterialCommunityIcons name={icono} color={tema.colores.primario} size={17} />
      <Secundario>{texto}</Secundario>
    </View>
  );
}

function DatoPartida({
  icono,
  etiqueta,
  valor,
}: {
  icono: keyof typeof MaterialCommunityIcons.glyphMap;
  etiqueta: string;
  valor: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <MaterialCommunityIcons name={icono} color={tema.colores.secundario} size={19} />
      <View style={{ flex: 1, gap: 2 }}>
        <Secundario>{etiqueta}</Secundario>
        <Text style={{ color: tema.colores.texto, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>{valor}</Text>
      </View>
    </View>
  );
}

function ModuloCompacto({
  nombre,
  detalle,
  icono,
  onPress,
}: {
  nombre: string;
  detalle: string;
  icono: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 43, height: 43, borderRadius: 13, backgroundColor: '#22351F', alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name={icono} color={tema.colores.primario} size={23} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Titulo pequeno>{nombre}</Titulo>
        <Secundario>{detalle}</Secundario>
      </View>
      <MaterialCommunityIcons name="chevron-right" color={tema.colores.secundario} size={23} />
    </Pressable>
  );
}

function ModuloGrande({
  nombre,
  detalle,
  icono,
  onPress,
}: {
  nombre: string;
  detalle: string;
  icono: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        padding: 16,
        backgroundColor: tema.colores.superficie,
        borderColor: tema.colores.borde,
        borderWidth: 1,
        borderRadius: 19,
      }}
    >
      <View style={{ width: 48, height: 48, borderRadius: 15, backgroundColor: '#22351F', alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name={icono} color={tema.colores.primario} size={25} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Titulo pequeno>{nombre}</Titulo>
        <Secundario>{detalle}</Secundario>
      </View>
      <MaterialCommunityIcons name="arrow-top-right" color={tema.colores.primario} size={21} />
    </Pressable>
  );
}
