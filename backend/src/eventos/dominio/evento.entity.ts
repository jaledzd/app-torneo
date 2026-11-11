import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoEvento } from './estado-evento.enum';

/**
 * Edición persistida del torneo. Las fechas con zona horaria guardan
 * instantes absolutos, evitando ambigüedades entre servidores y clientes.
 */
@Entity({ name: 'eventos' })
export class EventoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamptz', name: 'fecha_inicio' })
  fechaInicio: Date;

  @Column({ type: 'timestamptz', name: 'fecha_cierre_enfrentamientos' })
  fechaCierreEnfrentamientos: Date;

  @Column({ type: 'integer', name: 'duracion_periodo_adicional_minutos' })
  duracionPeriodoAdicionalMinutos: number;

  @Column({ type: 'varchar', length: 250 })
  premio: string;

  @Column({ type: 'enum', enum: EstadoEvento, enumName: 'eventos_estado_enum', default: EstadoEvento.BORRADOR })
  estado: EstadoEvento;

  @CreateDateColumn({ type: 'timestamptz', name: 'creado_en' })
  creadoEn: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'actualizado_en' })
  actualizadoEn: Date;
}
