import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { EstadoReto } from './estado-reto.enum';
/** Invitación entre dos participantes de una misma edición. */
@Entity({ name: 'retos' })
export class RetoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'uuid', name: 'evento_id' })
  eventoId: string;
  @Column({ type: 'uuid', name: 'emisor_id' })
  emisorId: string;
  @Column({ type: 'uuid', name: 'destinatario_id' })
  destinatarioId: string;
  @Column({ type: 'enum', enum: EstadoReto, enumName: 'retos_estado_enum', default: EstadoReto.PENDIENTE })
  estado: EstadoReto;
  @Column({ type: 'timestamptz', name: 'caduca_en' })
  caducaEn: Date;
  @Column({ type: 'uuid', name: 'partida_id', nullable: true })
  partidaId: string | null;
  @CreateDateColumn({ type: 'timestamptz', name: 'creado_en' })
  creadoEn: Date;
}
