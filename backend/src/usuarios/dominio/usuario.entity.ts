import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { RolUsuario } from './rol-usuario.enum';

/** Cuenta global de una persona dentro de APUCHITORNEO. */
@Entity({ name: 'usuarios' })
@Index('UQ_usuarios_email', ['email'], { unique: true })
export class UsuarioEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 254 })
  email: string;

  /** Contraseña derivada mediante scrypt; no se incluye en consultas ordinarias. */
  @Column({ type: 'varchar', length: 255, select: false, name: 'contrasena_hash' })
  contrasenaHash: string;

  @Column({ type: 'varchar', length: 80, name: 'nombre_visible' })
  nombreVisible: string;

  @Column({ type: 'enum', enum: RolUsuario, enumName: 'usuarios_rol_enum', default: RolUsuario.PARTICIPANTE })
  rol: RolUsuario;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'creado_en' })
  creadoEn: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'actualizado_en' })
  actualizadoEn: Date;
}
