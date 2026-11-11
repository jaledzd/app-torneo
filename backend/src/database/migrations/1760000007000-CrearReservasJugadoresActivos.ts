import { MigrationInterface, QueryRunner } from 'typeorm';

/** Registra reservas por participante para impedir ocupaciones cruzadas A/B. */
export class CrearReservasJugadoresActivos1760000007000 implements MigrationInterface {
  name = 'CrearReservasJugadoresActivos1760000007000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "partidas_jugadores_activos" (
        "participante_id" uuid NOT NULL,
        "partida_id" uuid NOT NULL,
        CONSTRAINT "PK_partidas_jugadores_activos" PRIMARY KEY ("participante_id"),
        CONSTRAINT "UQ_partidas_jugadores_activos_partida_participante" UNIQUE ("partida_id", "participante_id"),
        CONSTRAINT "FK_pja_participante" FOREIGN KEY ("participante_id") REFERENCES "participantes"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_pja_partida" FOREIGN KEY ("partida_id") REFERENCES "partidas"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      INSERT INTO "partidas_jugadores_activos" ("participante_id", "partida_id")
      SELECT "participante_a_id", "id" FROM "partidas" WHERE "estado" = 'EN_CURSO'
      UNION ALL
      SELECT "participante_b_id", "id" FROM "partidas" WHERE "estado" = 'EN_CURSO'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "partidas_jugadores_activos"`);
  }
}
