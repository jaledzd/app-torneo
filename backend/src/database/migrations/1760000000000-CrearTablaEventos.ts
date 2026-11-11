import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea la tabla de ediciones y su enum de estados.
 *
 * Las migraciones permiten evolucionar el esquema de forma reproducible
 * entre desarrollo, pruebas y producción sin synchronize=true.
 */
export class CrearTablaEventos1760000000000 implements MigrationInterface {
  name = 'CrearTablaEventos1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "eventos_estado_enum" AS ENUM ('BORRADOR', 'EN_CURSO', 'PERIODO_ADICIONAL', 'FINALIZADO')`);
    await queryRunner.query(`
      CREATE TABLE "eventos" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "fecha_inicio" TIMESTAMP WITH TIME ZONE NOT NULL,
        "fecha_cierre_enfrentamientos" TIMESTAMP WITH TIME ZONE NOT NULL,
        "duracion_periodo_adicional_minutos" integer NOT NULL,
        "premio" character varying(250) NOT NULL,
        "estado" "eventos_estado_enum" NOT NULL DEFAULT 'BORRADOR',
        "creado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "actualizado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_eventos_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_eventos_fechas" CHECK ("fecha_cierre_enfrentamientos" > "fecha_inicio"),
        CONSTRAINT "CHK_eventos_periodo_adicional" CHECK ("duracion_periodo_adicional_minutos" > 0)
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_eventos_estado" ON "eventos" ("estado")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_eventos_estado"`);
    await queryRunner.query(`DROP TABLE "eventos"`);
    await queryRunner.query(`DROP TYPE "eventos_estado_enum"`);
  }
}
