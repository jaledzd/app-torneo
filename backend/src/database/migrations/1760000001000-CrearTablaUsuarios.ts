import { MigrationInterface, QueryRunner } from 'typeorm';

/** Crea las cuentas globales y sus roles. */
export class CrearTablaUsuarios1760000001000 implements MigrationInterface {
  name = 'CrearTablaUsuarios1760000001000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "usuarios_rol_enum" AS ENUM ('PARTICIPANTE', 'ANFITRION', 'ADMINISTRADOR')`);
    await queryRunner.query(`
      CREATE TABLE "usuarios" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" varchar(254) NOT NULL,
        "contrasena_hash" varchar(255) NOT NULL,
        "nombre_visible" varchar(80) NOT NULL,
        "rol" "usuarios_rol_enum" NOT NULL DEFAULT 'PARTICIPANTE',
        "activo" boolean NOT NULL DEFAULT true,
        "creado_en" timestamptz NOT NULL DEFAULT now(),
        "actualizado_en" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_usuarios_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_usuarios_email" UNIQUE ("email")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "usuarios"`);
    await queryRunner.query(`DROP TYPE "usuarios_rol_enum"`);
  }
}
