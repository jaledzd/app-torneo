import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UsuarioEntity } from '../../usuarios/dominio/usuario.entity';
import { EstadoEvento } from './estado-evento.enum';

/** Edición del torneo y cuenta anfitriona responsable de su administración. */
@Entity({ name: 'eventos' })
export class EventoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'anfitrion_id' })
  anfitrionId: string;

  @ManyToOne(() => UsuarioEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'anfitrion_id' })
  anfitrion: UsuarioEntity;

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