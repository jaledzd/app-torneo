import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { DataSource } from 'typeorm';
import { UsuarioAutenticado } from '../autenticacion/dominio/usuario-autenticado.interface';
import { RolUsuario } from '../usuarios/dominio/rol-usuario.enum';
import { EventoEntity } from '../eventos/dominio/evento.entity';
import { EstadoEvento } from '../eventos/dominio/estado-evento.enum';
import { EstadoPartida } from '../enfrentamientos/dominio/estado-partida.enum';
import { PartidaEntity } from '../enfrentamientos/dominio/partida.entity';
import { EstadoParticipante } from '../participantes/dominio/estado-participante.enum';
import { ParticipanteEntity } from '../participantes/dominio/participante.entity';
import { EstadoPapeleta } from './dominio/estado-papeleta.enum';
import { PapeletaEntity } from './dominio/papeleta.entity';
import { SorteoEntity } from './dominio/sorteo.entity';
import { MovimientoApuchiCoinEntity } from '../apuchicoins/dominio/movimiento-apuchicoin.entity';

const PRECIO_PAPELETA = 3;

export interface SorteoConGanador extends SorteoEntity {
  participanteGanador: {
    id: string;
    nombreVisible: string;
  };
}
/** Gestiona la cartera, el cierre de la orla y el sorteo de una edición. */
@Injectable()
export class OrlaService {
  constructor(private readonly fuenteDatos: DataSource) {}

  async emitir(
    eventoId: string,
    participanteId: string,
    cantidad: number,
    actor: UsuarioAutenticado,
  ): Promise<{ emitidas: number; coste: number; saldoRestante: number }> {
    this.validarCantidad(cantidad, 500);

    return this.fuenteDatos.transaction(async (gestor) => {
      const evento = await gestor.getRepository(EventoEntity).findOne({
        where: { id: eventoId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!evento) {
        throw new NotFoundException('No se ha encontrado la edición');
      }

      this.autorizar(evento, actor);

      if (
        evento.orlaCerradaEn ||
        ![
          EstadoEvento.BORRADOR,
          EstadoEvento.EN_CURSO,
          EstadoEvento.PERIODO_ADICIONAL,
        ].includes(evento.estado)
      ) {
        throw new BadRequestException(
          'No se pueden emitir papeletas en esta fase',
        );
      }

      if (Date.now() >= this.limiteOrla(evento)) {
        throw new BadRequestException(
          'El plazo de emisión de papeletas ha terminado',
        );
      }

      const participantes = gestor.getRepository(ParticipanteEntity);

      const participante = await participantes.findOne({
        where: {
          id: participanteId,
          eventoId,
          estado: EstadoParticipante.INSCRITO,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!participante) {
        throw new NotFoundException(
          'No existe un participante inscrito en esta edición',
        );
      }

      const coste = cantidad * PRECIO_PAPELETA;

      // Descontamos las monedas solo si existe saldo suficiente.
      const resultado = await gestor.query(
        `UPDATE participantes
        SET saldo_apuchicoins = saldo_apuchicoins - $1
        WHERE id = $2
          AND evento_id = $3
          AND saldo_apuchicoins >= $1
        RETURNING saldo_apuchicoins`,
        [coste, participanteId, eventoId],
      );

      if (!resultado.length) {
        throw new BadRequestException(
          `El participante no tiene suficientes ApuchiCoins. Necesita ${coste} y dispone de ${participante.saldoApuchiCoins}.`,
        );
      }

      // Creamos las papeletas.
      const repoPapeletas = gestor.getRepository(PapeletaEntity);

      const nuevas = Array.from(
        { length: cantidad },
        () =>
          repoPapeletas.create({
            eventoId,
            participanteId,
            estado: EstadoPapeleta.CARTERA,
            depositadaEn: null,
          }),
      );

      await repoPapeletas.save(nuevas);

      // Registramos el gasto en el historial de monedas.
      await gestor.getRepository(MovimientoApuchiCoinEntity).save({
        eventoId,
        participanteId,
        partidaId: null,
        cantidad: -coste,
        motivo: 'COMPRA_PAPELETA',
        descripcion: `Compra de ${cantidad} papeleta(s) a ${PRECIO_PAPELETA} ApuchiCoins cada una`,
      });

      return {
        emitidas: nuevas.length,
        coste,
        saldoRestante: Number(resultado[0].saldo_apuchicoins),
      };
    });
  }

  async depositar(eventoId: string, usuarioId: string, cantidad: number): Promise<{ depositadas: number; enCartera: number }> {
    this.validarCantidad(cantidad);
    return this.fuenteDatos.transaction(async (gestor) => {
      const evento = await gestor.getRepository(EventoEntity).findOne({ where: { id: eventoId }, lock: { mode: 'pessimistic_write' } });
      if (!evento || evento.orlaCerradaEn || ![EstadoEvento.EN_CURSO, EstadoEvento.PERIODO_ADICIONAL].includes(evento.estado)) {
        throw new BadRequestException('La orla no está abierta');
      }
      if (Date.now() >= this.limiteOrla(evento)) throw new BadRequestException('El plazo de la orla ha terminado');
      const participante = await gestor.getRepository(ParticipanteEntity).findOne({ where: { eventoId, usuarioId, estado: EstadoParticipante.INSCRITO } });
      if (!participante) throw new NotFoundException('No estás inscrito en esta edición');
      const repo = gestor.getRepository(PapeletaEntity);
      const cartera = await repo.createQueryBuilder('p').setLock('pessimistic_write')
        .where('p.evento_id = :eventoId AND p.participante_id = :participanteId AND p.estado = :estado', { eventoId, participanteId: participante.id, estado: EstadoPapeleta.CARTERA })
        .orderBy('p.creada_en', 'ASC').getMany();
      if (cartera.length < cantidad) throw new BadRequestException('No tienes suficientes papeletas en la cartera');
      const seleccionadas = cartera.slice(0, cantidad);
      const ahora = new Date();
      seleccionadas.forEach((papeleta) => { papeleta.estado = EstadoPapeleta.ORLA; papeleta.depositadaEn = ahora; });
      await repo.save(seleccionadas);
      return { depositadas: seleccionadas.length, enCartera: cartera.length - seleccionadas.length };
    });
  }

  async consultar(eventoId: string, usuarioId: string): Promise<{ cartera: number; orla: number }> {
    const participante = await this.fuenteDatos.getRepository(ParticipanteEntity).findOne({ where: { eventoId, usuarioId } });
    if (!participante) throw new NotFoundException('No existe tu inscripción en esta edición');
    const filas = await this.fuenteDatos.getRepository(PapeletaEntity).createQueryBuilder('p')
      .select('p.estado', 'estado').addSelect('COUNT(*)', 'cantidad')
      .where('p.evento_id = :eventoId AND p.participante_id = :participanteId', { eventoId, participanteId: participante.id })
      .groupBy('p.estado').getRawMany<{ estado: EstadoPapeleta; cantidad: string }>();
    return {
      cartera: Number(filas.find((f) => f.estado === EstadoPapeleta.CARTERA)?.cantidad ?? 0),
      orla: Number(filas.find((f) => f.estado === EstadoPapeleta.ORLA)?.cantidad ?? 0),
    };
  }

  async cerrarOrla(eventoId: string, actor: UsuarioAutenticado): Promise<EventoEntity> {
    return this.fuenteDatos.transaction(async (gestor) => {
      const eventos = gestor.getRepository(EventoEntity);
      const evento = await eventos.findOne({ where: { id: eventoId }, lock: { mode: 'pessimistic_write' } });
      if (!evento) throw new NotFoundException('No se ha encontrado la edición');
      this.autorizar(evento, actor);
      if (evento.orlaCerradaEn) throw new ConflictException('La orla ya está cerrada');
      if (![EstadoEvento.EN_CURSO, EstadoEvento.PERIODO_ADICIONAL].includes(evento.estado)) throw new BadRequestException('La orla solo se puede cerrar durante el torneo o el periodo adicional');
      const limite = this.limiteOrla(evento);
      const partidasActivas = await gestor.getRepository(PartidaEntity).count({ where: { eventoId, estado: EstadoPartida.EN_CURSO } });
      if (Date.now() < limite) {
        if (partidasActivas > 0) throw new ConflictException('No se puede cerrar antes de tiempo mientras haya partidas en curso');
        const papeletasEnCartera = await gestor.getRepository(PapeletaEntity).count({ where: { eventoId, estado: EstadoPapeleta.CARTERA } });
        if (papeletasEnCartera > 0) throw new ConflictException('Todavía quedan papeletas sin depositar en las carteras');
      }
      if (Date.now() < evento.fechaCierreEnfrentamientos.getTime()) throw new BadRequestException('El torneo todavía no ha llegado al cierre de enfrentamientos');
      evento.estado = EstadoEvento.PERIODO_ADICIONAL;
      evento.orlaCerradaEn = new Date();
      return eventos.save(evento);
    });
  }

  async regalar(
  eventoId: string,
  participanteId: string,
  cantidad: number,
  actor: UsuarioAutenticado,
): Promise<{ regaladas: number }> {
  this.validarCantidad(cantidad, 500);

  return this.fuenteDatos.transaction(async (gestor) => {
    const evento = await gestor.getRepository(EventoEntity).findOne({
      where: { id: eventoId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!evento) {
      throw new NotFoundException('No se ha encontrado la edición');
    }

    this.autorizar(evento, actor);

    if (
      evento.orlaCerradaEn ||
      ![
        EstadoEvento.BORRADOR,
        EstadoEvento.EN_CURSO,
        EstadoEvento.PERIODO_ADICIONAL,
      ].includes(evento.estado)
    ) {
      throw new BadRequestException(
        'No se pueden regalar papeletas en esta fase',
      );
    }

    if (Date.now() >= this.limiteOrla(evento)) {
      throw new BadRequestException(
        'El plazo para regalar papeletas ha terminado',
      );
    }

    const participante = await gestor
      .getRepository(ParticipanteEntity)
      .findOne({
        where: {
          id: participanteId,
          eventoId,
          estado: EstadoParticipante.INSCRITO,
        },
        lock: { mode: 'pessimistic_write' },
      });

    if (!participante) {
      throw new NotFoundException(
        'No existe un participante inscrito en esta edición',
      );
    }

    const repoPapeletas = gestor.getRepository(PapeletaEntity);

    const nuevas = Array.from(
      { length: cantidad },
      () =>
        repoPapeletas.create({
          eventoId,
          participanteId,
          estado: EstadoPapeleta.CARTERA,
          depositadaEn: null,
        }),
    );

    await repoPapeletas.save(nuevas);

    // Dejamos constancia del regalo sin modificar el saldo.
    await gestor.getRepository(MovimientoApuchiCoinEntity).save({
      eventoId,
      participanteId,
      partidaId: null,
      cantidad: 0,
      motivo: 'REGALO_PAPELETA',
      descripcion: `Regalo de ${cantidad} papeleta(s) por el anfitrión`,
    });

    return {
      regaladas: nuevas.length,
    };
  });
}

  async realizarSorteo(eventoId: string, actor: UsuarioAutenticado): Promise<SorteoConGanador> {
    const sorteo = await this.fuenteDatos.transaction(async (gestor) => {
      const eventos = gestor.getRepository(EventoEntity);
      const evento = await eventos.findOne({ where: { id: eventoId }, lock: { mode: 'pessimistic_write' } });
      if (!evento) throw new NotFoundException('No se ha encontrado la edición');
      this.autorizar(evento, actor);
      if (evento.estado === EstadoEvento.EN_CURSO && Date.now() >= evento.fechaCierreEnfrentamientos.getTime()) {
        evento.estado = EstadoEvento.PERIODO_ADICIONAL;
      }
      if (evento.estado !== EstadoEvento.PERIODO_ADICIONAL || !evento.orlaCerradaEn) {
        throw new BadRequestException('Primero debe cerrarse la orla');
      }
      const sorteos = gestor.getRepository(SorteoEntity);
      if (await sorteos.findOne({ where: { eventoId } })) throw new ConflictException('Esta edición ya tiene un sorteo realizado');
      const partidasActivas = await gestor.getRepository(PartidaEntity).count({ where: { eventoId, estado: EstadoPartida.EN_CURSO } });
      if (partidasActivas > 0) throw new ConflictException('No se puede sortear mientras queden partidas en curso');
      const repo = gestor.getRepository(PapeletaEntity);
      const papeletas = await repo.find({ where: { eventoId, estado: EstadoPapeleta.ORLA } });
      if (papeletas.length === 0) throw new BadRequestException('No hay papeletas depositadas para el sorteo');

      // El ganador se decide y persiste una sola vez en el servidor.
      const ganadora = papeletas[randomInt(papeletas.length)];
      ganadora.estado = EstadoPapeleta.GANADORA;
      await repo.save(ganadora);

      // Todos los dispositivos usan estas mismas marcas temporales para sincronizar la animación.
      const animacionInicioEn = new Date();
      const revelarEn = new Date(animacionInicioEn.getTime() + 9000);
      const resultado = await sorteos.save(sorteos.create({
        eventoId,
        papeletaGanadoraId: ganadora.id,
        participanteGanadorId: ganadora.participanteId,
        premio: evento.premio,
        animacionInicioEn,
        revelarEn,
      }));
      evento.estado = EstadoEvento.FINALIZADO;
      await eventos.save(evento);
      return resultado;
    });

    return this.detalleSorteo(sorteo);
  }

  async obtenerSorteo(eventoId: string): Promise<SorteoConGanador> {
    const sorteo = await this.fuenteDatos.getRepository(SorteoEntity).findOne({ where: { eventoId } });
    if (!sorteo) throw new NotFoundException('Todavía no se ha realizado el sorteo');
    return this.detalleSorteo(sorteo);
  }

  private async detalleSorteo(sorteo: SorteoEntity): Promise<SorteoConGanador> {
    const participante = await this.fuenteDatos.getRepository(ParticipanteEntity).findOne({
      where: { id: sorteo.participanteGanadorId, eventoId: sorteo.eventoId },
      relations: { usuario: true },
    });
    if (!participante) throw new NotFoundException('No se ha encontrado al participante ganador');
    return {
      ...sorteo,
      participanteGanador: {
        id: participante.id,
        nombreVisible: participante.usuario.nombreVisible,
      },
    };
  }

  private autorizar(evento: EventoEntity, actor: UsuarioAutenticado): void {
    if (actor.rol !== RolUsuario.ADMINISTRADOR && evento.anfitrionId !== actor.id) {
      throw new ForbiddenException('Solo el anfitrión responsable o un administrador puede gestionar esta edición');
    }
  }

  private limiteOrla(evento: EventoEntity): number {
    return evento.fechaCierreEnfrentamientos.getTime() + evento.duracionPeriodoAdicionalMinutos * 60_000;
  }

  private validarCantidad(cantidad: number, maximo = 100): void {
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > maximo) throw new BadRequestException(`La cantidad debe estar entre 1 y ${maximo}`);
  }
}
