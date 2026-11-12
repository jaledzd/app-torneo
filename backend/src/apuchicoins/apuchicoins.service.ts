import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { EstadoParticipante } from '../participantes/dominio/estado-participante.enum';
import { ParticipanteEntity } from '../participantes/dominio/participante.entity';
import { MovimientoApuchiCoinEntity } from './dominio/movimiento-apuchicoin.entity';

/** Operaciones de saldo dentro de la misma transacción que la partida. */
@Injectable()
export class ApuchiCoinsService {
  constructor(
    @InjectRepository(MovimientoApuchiCoinEntity)
    private readonly movimientos: Repository<MovimientoApuchiCoinEntity>,
    @InjectRepository(ParticipanteEntity)
    private readonly participantes: Repository<ParticipanteEntity>,
  ) {}

  async acreditarVictoria(
    gestor: EntityManager,
    eventoId: string,
    participanteId: string,
    partidaId: string,
    descripcion: string,
  ): Promise<void> {
    const movimientos = gestor.getRepository(MovimientoApuchiCoinEntity);

    const existente = await movimientos.findOne({
      where: {
        partidaId,
        motivo: 'VICTORIA_PARTIDA',
      },
    });

    if (existente) return;

    const resultado = await gestor
      .getRepository(ParticipanteEntity)
      .createQueryBuilder()
      .update(ParticipanteEntity)
      .set({
        saldoApuchiCoins: () => '"saldo_apuchicoins" + 1',
      })
      .where(
        'id = :participanteId AND evento_id = :eventoId',
        { participanteId, eventoId },
      )
      .execute();

    if (!resultado.affected) {
      throw new NotFoundException(
        'No se pudo actualizar el saldo del ganador',
      );
    }

    await movimientos.save(
      movimientos.create({
        eventoId,
        participanteId,
        partidaId,
        cantidad: 1,
        motivo: 'VICTORIA_PARTIDA',
        descripcion,
      }),
    );
  }

  async consultarSaldo(eventoId: string, usuarioId: string): Promise<{ saldo: number }> {
    const participante = await this.participantes.findOne({ where: { eventoId, usuarioId, estado: EstadoParticipante.INSCRITO } });
    if (!participante) throw new NotFoundException('No estás inscrito en esta edición');
    return { saldo: participante.saldoApuchiCoins };
  }

  async consultarMovimientosUsuario(eventoId: string, usuarioId: string): Promise<MovimientoApuchiCoinEntity[]> {
    const participante = await this.participantes.findOne({ where: { eventoId, usuarioId } });
    if (!participante) throw new NotFoundException('No existe tu inscripción en esta edición');
    return this.consultarMovimientos(eventoId, participante.id);
  }

  consultarMovimientos(eventoId: string, participanteId: string): Promise<MovimientoApuchiCoinEntity[]> {
    return this.movimientos.find({ where: { eventoId, participanteId }, order: { creadoEn: 'DESC' } });
  }
}
