import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EventoEntity } from '../../eventos/dominio/evento.entity';
import { UsuarioEntity } from '../../usuarios/dominio/usuario.entity';
import { EstadoParticipante } from './estado-participante.enum';

/** Vincula una cuenta global con una edición concreta del torneo. */
@Entity({ name: 'participantes' })
@Index('UQ_participante_evento_usuario', ['eventoId', 'usuarioId'], { unique: true })
export class ParticipanteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'evento_id' })
  eventoId: string;

  @ManyToOne(() => EventoEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evento_id' })
  evento: EventoEntity;

  @Column({ type: 'uuid', name: 'usuario_id' })
  usuarioId: string;

  @ManyToOne(() => UsuarioEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: UsuarioEntity;

  @Column({ type: 'enum', enum: EstadoParticipante, enumName: 'participantes_estado_enum', default: EstadoParticipante.INSCRITO })
  estado: EstadoParticipante;

  @Column({ type: 'integer', default: 0, name: 'saldo_apuchicoins' })
  saldoApuchiCoins: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'inscrito_en' })
  inscritoEn: Date;
}
