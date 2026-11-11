import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { EstadoPapeleta } from './estado-papeleta.enum';
/** Papeleta individual: su identificador único es la unidad del sorteo. */
@Entity({ name: 'papeletas' })
export class PapeletaEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid', name: 'evento_id' }) eventoId: string;
  @Column({ type: 'uuid', name: 'participante_id' }) participanteId: string;
  @Column({ type: 'enum', enum: EstadoPapeleta, enumName: 'papeletas_estado_enum', default: EstadoPapeleta.CARTERA }) estado: EstadoPapeleta;
  @Column({ type: 'timestamptz', name: 'depositada_en', nullable: true }) depositadaEn: Date | null;
  @CreateDateColumn({ type: 'timestamptz', name: 'creada_en' }) creadaEn: Date;
}
