import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EventoEntity } from '../eventos/dominio/evento.entity';
import { EstadoEvento } from '../eventos/dominio/estado-evento.enum';
import { EstadoParticipante } from '../participantes/dominio/estado-participante.enum';
import { ParticipanteEntity } from '../participantes/dominio/participante.entity';
import { PuestoEntity } from '../puestos/dominio/puesto.entity';
import { VideojuegoEntity } from '../videojuegos/dominio/videojuego.entity';
import { EstadoPartida } from './dominio/estado-partida.enum';
import { PartidaEntity } from './dominio/partida.entity';
import { EstadoReto } from './dominio/estado-reto.enum';
import { RetoEntity } from './dominio/reto.entity';

/** Coordina retos y reserva atómica de recursos físicos y lógicos. */
@Injectable()
export class EnfrentamientosService {
  constructor(
    private readonly fuenteDatos: DataSource,
    @InjectRepository(RetoEntity) private readonly retos: Repository<RetoEntity>,
    @InjectRepository(PartidaEntity) private readonly partidas: Repository<PartidaEntity>,
  ) {}

  async enviarReto(eventoId: string, emisorUsuarioId: string, destinatarioParticipanteId: string): Promise<RetoEntity> {
    return this.fuenteDatos.transaction(async (gestor) => {
      const evento = await gestor.getRepository(EventoEntity).findOne({ where: { id: eventoId }, lock: { mode: 'pessimistic_write' } });
      if (!evento || evento.estado !== EstadoEvento.EN_CURSO) throw new BadRequestException('La edición no admite nuevos retos');
      const repoParticipantes = gestor.getRepository(ParticipanteEntity);
      const emisor = await repoParticipantes.findOne({ where: { eventoId, usuarioId: emisorUsuarioId, estado: EstadoParticipante.INSCRITO }, lock: { mode: 'pessimistic_write' } });
      const destinatario = await repoParticipantes.findOne({ where: { id: destinatarioParticipanteId, eventoId, estado: EstadoParticipante.INSCRITO }, lock: { mode: 'pessimistic_write' } });
      if (!emisor || !destinatario) throw new NotFoundException('Ambos jugadores deben estar inscritos en esta edición');
      if (emisor.id === destinatario.id) throw new BadRequestException('No puedes enviarte un reto a ti mismo');
      const ids = [emisor.id, destinatario.id];
      const partidas = gestor.getRepository(PartidaEntity);
      const ocupados = await partidas.createQueryBuilder('p')
        .where('p.estado = :estado AND (p.participante_a_id IN (:...ids) OR p.participante_b_id IN (:...ids))', { estado: EstadoPartida.EN_CURSO, ids }).getCount();
      if (ocupados) throw new ConflictException('Uno de los jugadores ya está disputando una partida');
      const retoRepo = gestor.getRepository(RetoEntity);
      const pendiente = await retoRepo.findOne({ where: { eventoId, destinatarioId: destinatario.id, estado: EstadoReto.PENDIENTE } });
      if (pendiente && pendiente.caducaEn > new Date()) throw new ConflictException('El destinatario ya tiene una solicitud pendiente');
      if (pendiente) {
        pendiente.estado = EstadoReto.CADUCADO;
        await retoRepo.save(pendiente);
      }
      const minutos = Number(process.env.RETO_CADUCIDAD_MINUTOS ?? 5);
      const caducidad = Number.isInteger(minutos) && minutos > 0 ? minutos : 5;
      return retoRepo.save(retoRepo.create({
        eventoId, emisorId: emisor.id, destinatarioId: destinatario.id,
        estado: EstadoReto.PENDIENTE, caducaEn: new Date(Date.now() + caducidad * 60_000), partidaId: null,
      }));
    });
  }

  async aceptarReto(eventoId: string, retoId: string, destinatarioUsuarioId: string, puestoId: string, videojuegoId: string): Promise<PartidaEntity> {
    return this.fuenteDatos.transaction(async (gestor) => {
      const repoRetos = gestor.getRepository(RetoEntity);
      const reto = await repoRetos.findOne({ where: { id: retoId, eventoId }, lock: { mode: 'pessimistic_write' } });
      if (!reto) throw new NotFoundException('No se ha encontrado el reto');
      const destinatario = await gestor.getRepository(ParticipanteEntity).findOne({ where: { id: reto.destinatarioId, eventoId, usuarioId: destinatarioUsuarioId } });
      if (!destinatario) throw new BadRequestException('Solo el destinatario puede aceptar este reto');
      if (reto.estado !== EstadoReto.PENDIENTE) throw new ConflictException('El reto ya no está pendiente');
      if (reto.caducaEn <= new Date()) throw new BadRequestException('El plazo de aceptación del reto ha terminado');
      const evento = await gestor.getRepository(EventoEntity).findOne({ where: { id: eventoId }, lock: { mode: 'pessimistic_write' } });
      if (!evento || evento.estado !== EstadoEvento.EN_CURSO) throw new BadRequestException('La edición ya no permite iniciar partidas');
      const participantesRepo = gestor.getRepository(ParticipanteEntity);
      const ids = [reto.emisorId, reto.destinatarioId].sort();
      const participantes = await participantesRepo.createQueryBuilder('p').setLock('pessimistic_write')
        .where('p.evento_id = :eventoId AND p.id IN (:...ids) AND p.estado = :estado', { eventoId, ids, estado: EstadoParticipante.INSCRITO }).getMany();
      if (participantes.length !== 2) throw new BadRequestException('Los dos jugadores deben seguir inscritos');
      const puesto = await gestor.getRepository(PuestoEntity).findOne({ where: { id: puestoId, eventoId, activo: true }, relations: { videojuegos: true }, lock: { mode: 'pessimistic_write' } });
      if (!puesto || !puesto.videojuegos.some((juego) => juego.id === videojuegoId)) throw new BadRequestException('El puesto no es compatible con ese videojuego');
      const juego = await gestor.getRepository(VideojuegoEntity).findOne({ where: { id: videojuegoId, activo: true }, lock: { mode: 'pessimistic_write' } });
      if (!juego) throw new NotFoundException('No se ha encontrado el videojuego activo');
      const partidas = gestor.getRepository(PartidaEntity);
      const ocupacion = await partidas.createQueryBuilder('p').setLock('pessimistic_write')
        .where('p.estado = :estado AND (p.puesto_id = :puestoId OR p.videojuego_id = :videojuegoId OR p.participante_a_id IN (:...ids) OR p.participante_b_id IN (:...ids))',
          { estado: EstadoPartida.EN_CURSO, puestoId, videojuegoId, ids }).getCount();
      if (ocupacion) throw new ConflictException('Un jugador, el puesto o el videojuego ya está ocupado');
      const partida = await partidas.save(partidas.create({
        eventoId, participanteAId: reto.emisorId, participanteBId: reto.destinatarioId,
        puestoId, videojuegoId, estado: EstadoPartida.EN_CURSO, ganadorId: null, finalizadaEn: null,
      }));
      reto.estado = EstadoReto.ACEPTADO;
      reto.partidaId = partida.id;
      await repoRetos.save(reto);
      return partida;
    });
  }

  async finalizarPartida(eventoId: string, partidaId: string, ganadorId: string): Promise<PartidaEntity> {
    return this.fuenteDatos.transaction(async (gestor) => {
      const repo = gestor.getRepository(PartidaEntity);
      const partida = await repo.findOne({ where: { id: partidaId, eventoId }, lock: { mode: 'pessimistic_write' } });
      if (!partida) throw new NotFoundException('No se ha encontrado la partida');
      if (partida.estado !== EstadoPartida.EN_CURSO) throw new ConflictException('La partida ya está finalizada');
      if (![partida.participanteAId, partida.participanteBId].includes(ganadorId)) throw new BadRequestException('El ganador debe ser uno de los dos participantes');
      partida.estado = EstadoPartida.FINALIZADA;
      partida.ganadorId = ganadorId;
      partida.finalizadaEn = new Date();
      return repo.save(partida);
    });
  }

  listarPartidas(eventoId: string): Promise<PartidaEntity[]> {
    return this.partidas.find({ where: { eventoId }, order: { iniciadaEn: 'DESC' } });
  }

  async listarRetosRecibidosPorUsuario(eventoId: string, usuarioId: string): Promise<RetoEntity[]> {
    const participante = await this.fuenteDatos.getRepository(ParticipanteEntity).findOne({ where: { eventoId, usuarioId, estado: EstadoParticipante.INSCRITO } });
    if (!participante) throw new NotFoundException('No estás inscrito en esta edición');
    return this.retos.find({ where: { eventoId, destinatarioId: participante.id, estado: EstadoReto.PENDIENTE }, order: { creadoEn: 'ASC' } });
  }
}
