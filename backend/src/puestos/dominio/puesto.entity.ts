import { Column, CreateDateColumn, Entity, Index, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { VideojuegoEntity } from '../../videojuegos/dominio/videojuego.entity';

/** Puesto físico de juego perteneciente a una edición. */
@Entity({ name: 'puestos' })
@Index('UQ_puestos_evento_codigo', ['eventoId', 'codigo'], { unique: true })
export class PuestoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'evento_id' })
  eventoId: string;

  @Column({ type: 'varchar', length: 30 })
  codigo: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  descripcion: string | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @ManyToMany(() => VideojuegoEntity, (videojuego) => videojuego.puestosCompatibles)
  @JoinTable({
    name: 'puestos_videojuegos',
    joinColumn: { name: 'puesto_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'videojuego_id', referencedColumnName: 'id' },
  })
  videojuegos: VideojuegoEntity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'creado_en' })
  creadoEn: Date;
}
