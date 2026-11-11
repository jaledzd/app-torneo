import { Column, CreateDateColumn, Entity, Index, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PuestoEntity } from '../../puestos/dominio/puesto.entity';

/** Catálogo de videojuegos que pueden utilizarse en el torneo. */
@Entity({ name: 'videojuegos' })
@Index('UQ_videojuegos_nombre', ['nombre'], { unique: true })
export class VideojuegoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  plataforma: string | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @ManyToMany(() => PuestoEntity, (puesto) => puesto.videojuegos)
  puestosCompatibles: PuestoEntity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'creado_en' })
  creadoEn: Date;
}
