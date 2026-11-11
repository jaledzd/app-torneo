import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoPartida } from './estado-partida.enum';
/** Enfrentamiento que ocupa jugadores, un puesto y un videojuego. */
@Entity({ name: 'partidas' })
export class PartidaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'uuid', name: 'evento_id' })
  eventoId: string;
  @Column({ type: 'uuid', name: 'participante_a_id' })
  participanteAId: string;
  @Column({ type: 'uuid', name: 'participante_b_id' })
  participanteBId: string;
  @Column({ type: 'uuid', name: 'puesto_id' })
  puestoId: string;
  @Column({ type: 'uuid', name: 'videojuego_id' })
  videojuegoId: string;
  @Column({ type: 'enum', enum: EstadoPartida, enumName: 'partidas_estado_enum', default: EstadoPartida.EN_CURSO })
  estado: EstadoPartida;
  @Column({ type: 'uuid', name: 'ganador_id', nullable: true })
  ganadorId: string | null;
  @Column({ type: 'timestamptz', name: 'iniciada_en', default: () => 'now()' })
  iniciadaEn: Date;
  @Column({ type: 'timestamptz', name: 'finalizada_en', nullable: true })
  finalizadaEn: Date | null;
  @CreateDateColumn({ type: 'timestamptz', name: 'creada_en' })
  creadaEn: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'actualizada_en' })
  actualizadaEn: Date;
}
