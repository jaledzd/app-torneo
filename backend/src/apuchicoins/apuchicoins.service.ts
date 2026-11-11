import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ParticipanteEntity } from '../participantes/dominio/participante.entity';
import { MovimientoApuchiCoinEntity } from './dominio/movimiento-apuchicoin.entity';
/** Operaciones de saldo dentro de la misma transacción que la partida. */
@Injectable()
export class ApuchiCoinsService {
  async acreditarVictoria(gestor: EntityManager, eventoId: string, participanteId: string, partidaId: string): Promise<void> {
    const movimientos = gestor.getRepository(MovimientoApuchiCoinEntity);
    const existente = await movimientos.findOne({ where: { partidaId } });
    if (existente) return;
    const resultado = await gestor.getRepository(ParticipanteEntity).createQueryBuilder()
      .update(ParticipanteEntity)
      .set({ saldoApuchiCoins: () => '"saldo_apuchicoins" + 1' })
      .where('id = :participanteId AND evento_id = :eventoId', { participanteId, eventoId })
      .execute();
    if (!resultado.affected) throw new Error('No se pudo actualizar el saldo del ganador');
    await movimientos.save(movimientos.create({ eventoId, participanteId, partidaId, cantidad: 1, motivo: 'VICTORIA_PARTIDA' }));
  }

  consultarMovimientos(eventoId: string, participanteId: string): Promise<MovimientoApuchiCoinEntity[]> {
    return this.movimientos.find({ where: { eventoId, participanteId }, order: { creadoEn: 'DESC' } });
  }

  constructor(private readonly movimientos: import('typeorm').Repository<MovimientoApuchiCoinEntity>) {}
}
