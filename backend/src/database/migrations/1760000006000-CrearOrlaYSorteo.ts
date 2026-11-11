import { MigrationInterface, QueryRunner } from 'typeorm';

/** Añade papeletas individuales y un único resultado de sorteo por edición. */
export class CrearOrlaYSorteo1760000006000 implements MigrationInterface {
  name = 'CrearOrlaYSorteo1760000006000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "papeletas_estado_enum" AS ENUM ('CARTERA', 'ORLA', 'GANADORA')
    `);
    await queryRunner.query(`
      CREATE TABLE "papeletas" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "evento_id" uuid NOT NULL,
        "participante_id" uuid NOT NULL,
        "estado" "papeletas_estado_enum" NOT NULL DEFAULT 'CARTERA',
        "depositada_en" timestamptz,
        "creada_en" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_papeletas_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_papeletas_evento" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_papeletas_participante" FOREIGN KEY ("participante_id") REFERENCES "participantes"("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_papeletas_deposito" CHECK (("estado" = 'CARTERA' AND "depositada_en" IS NULL) OR ("estado" IN ('ORLA', 'GANADORA') AND "depositada_en" IS NOT NULL))
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_papeletas_evento_estado" ON "papeletas" ("evento_id", "estado")`);
    await queryRunner.query(`
      CREATE TABLE "sorteos" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "evento_id" uuid NOT NULL,
        "papeleta_ganadora_id" uuid NOT NULL,
        "participante_ganador_id" uuid NOT NULL,
        "realizado_en" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sorteos_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sorteos_evento" UNIQUE ("evento_id"),
        CONSTRAINT "UQ_sorteos_papeleta" UNIQUE ("papeleta_ganadora_id"),
        CONSTRAINT "FK_sorteos_evento" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sorteos_papeleta" FOREIGN KEY ("papeleta_ganadora_id") REFERENCES "papeletas"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_sorteos_participante" FOREIGN KEY ("participante_ganador_id") REFERENCES "participantes"("id") ON DELETE RESTRICT
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "sorteos"`);
    await queryRunner.query(`DROP INDEX "IDX_papeletas_evento_estado"`);
    await queryRunner.query(`DROP TABLE "papeletas"`);
    await queryRunner.query(`DROP TYPE "papeletas_estado_enum"`);
  }
}
