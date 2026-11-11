import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
/** Libro mayor inmutable de movimientos de ApuchiCoins. */
@Entity({ name: 'movimientos_apuchicoins' })
@Index('UQ_movimiento_victoria_partida', ['partidaId'], { unique: true })
export class MovimientoApuchiCoinEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'uuid', name: 'evento_id' })
  eventoId: string;
  @Column({ type: 'uuid', name: 'participante_id' })
  participanteId: string;
  @Column({ type: 'uuid', name: 'partida_id', nullable: true })
  partidaId: string | null;
  @Column({ type: 'integer' })
  cantidad: number;
  @Column({ type: 'varchar', length: 30 })
  motivo: string;
  @CreateDateColumn({ type: 'timestamptz', name: 'creado_en' })
  creadoEn: Date;
}
