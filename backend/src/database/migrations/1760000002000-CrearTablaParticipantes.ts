import { MigrationInterface, QueryRunner } from 'typeorm';

/** Relaciona cuentas y ediciones; el saldo inicial siempre es cero. */
export class CrearTablaParticipantes1760000002000 implements MigrationInterface {
  name = 'CrearTablaParticipantes1760000002000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "participantes_estado_enum" AS ENUM ('INSCRITO', 'RETIRADO')`);
    await queryRunner.query(`
      CREATE TABLE "participantes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "evento_id" uuid NOT NULL,
        "usuario_id" uuid NOT NULL,
        "estado" "participantes_estado_enum" NOT NULL DEFAULT 'INSCRITO',
        "saldo_apuchicoins" integer NOT NULL DEFAULT 0,
        "inscrito_en" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_participantes_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_participantes_evento" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_participantes_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT,
        CONSTRAINT "UQ_participante_evento_usuario" UNIQUE ("evento_id", "usuario_id"),
        CONSTRAINT "CHK_participantes_saldo" CHECK ("saldo_apuchicoins" >= 0)
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_participantes_evento_estado" ON "participantes" ("evento_id", "estado")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_participantes_evento_estado"`);
    await queryRunner.query(`DROP TABLE "participantes"`);
    await queryRunner.query(`DROP TYPE "participantes_estado_enum"`);
  }
}
