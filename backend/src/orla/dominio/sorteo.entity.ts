import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
/** Resultado inmutable del sorteo de una edición. */
@Entity({ name: 'sorteos' })
@Index('UQ_sorteo_evento', ['eventoId'], { unique: true })
export class SorteoEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid', name: 'evento_id' }) eventoId: string;
  @Column({ type: 'uuid', name: 'papeleta_ganadora_id' }) papeletaGanadoraId: string;
  @Column({ type: 'uuid', name: 'participante_ganador_id' }) participanteGanadorId: string;
  @CreateDateColumn({ type: 'timestamptz', name: 'realizado_en' }) realizadoEn: Date;
}
