
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { EstadoPartida } from './estado-partida.enum';
import { ParticipanteEntity } from '../../participantes/dominio/participante.entity';
import { PuestoEntity } from '../../puestos/dominio/puesto.entity';
import { VideojuegoEntity } from '../../videojuegos/dominio/videojuego.entity';

/** Enfrentamiento que ocupa jugadores, un puesto y un videojuego. */
@Entity({ name: 'partidas' })
export class PartidaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'evento_id' })
  eventoId: string;

  @Column({ type: 'uuid', name: 'participante_a_id' })
  participanteAId: string;

  @ManyToOne(() => ParticipanteEntity)
  @JoinColumn({ name: 'participante_a_id' })
  participanteA: ParticipanteEntity;

  @Column({ type: 'uuid', name: 'participante_b_id' })
  participanteBId: string;

  @ManyToOne(() => ParticipanteEntity)
  @JoinColumn({ name: 'participante_b_id' })
  participanteB: ParticipanteEntity;

  @Column({ type: 'uuid', name: 'puesto_id' })
  puestoId: string;

  @ManyToOne(() => PuestoEntity)
  @JoinColumn({ name: 'puesto_id' })
  puesto: PuestoEntity;

  @Column({ type: 'uuid', name: 'videojuego_id' })
  videojuegoId: string;

  @ManyToOne(() => VideojuegoEntity)
  @JoinColumn({ name: 'videojuego_id' })
  videojuego: VideojuegoEntity;

  @Column({
    type: 'enum',
    enum: EstadoPartida,
    enumName: 'partidas_estado_enum',
    default: EstadoPartida.EN_CURSO,
  })
  estado: EstadoPartida;

  @Column({ type: 'uuid', name: 'ganador_id', nullable: true })
  ganadorId: string | null;

  @ManyToOne(() => ParticipanteEntity, { nullable: true })
  @JoinColumn({ name: 'ganador_id' })
  ganador: ParticipanteEntity | null;

  @Column({ type: 'timestamptz', name: 'iniciada_en', default: () => 'now()' })
  iniciadaEn: Date;

  @Column({ type: 'timestamptz', name: 'finalizada_en', nullable: true })
  finalizadaEn: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'creada_en' })
  creadaEn: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'actualizada_en' })
  actualizadaEn: Date;
}
