import { MigrationInterface, QueryRunner } from 'typeorm';

/** Impide asignar a una partida un puesto ajeno al evento o un juego incompatible; conserva el premio sorteado. */
export class IntegridadPuestoPartidaYSorteo1760000012000 implements MigrationInterface {
  name = 'IntegridadPuestoPartidaYSorteo1760000012000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "puestos" ADD CONSTRAINT "UQ_puestos_id_evento" UNIQUE ("id", "evento_id")`);
    await queryRunner.query(`ALTER TABLE "partidas" ADD CONSTRAINT "FK_partidas_puesto_evento" FOREIGN KEY ("puesto_id", "evento_id") REFERENCES "puestos"("id", "evento_id") ON DELETE RESTRICT`);
    await queryRunner.query(`ALTER TABLE "partidas" ADD CONSTRAINT "FK_partidas_juego_compatible_puesto" FOREIGN KEY ("puesto_id", "videojuego_id") REFERENCES "puestos_videojuegos"("puesto_id", "videojuego_id") ON DELETE RESTRICT`);
    await queryRunner.query(`ALTER TABLE "sorteos" ADD COLUMN "premio" varchar(250)`);
    await queryRunner.query(`UPDATE "sorteos" SET "premio" = "eventos"."premio" FROM "eventos" WHERE "eventos"."id" = "sorteos"."evento_id"`);
    await queryRunner.query(`ALTER TABLE "sorteos" ALTER COLUMN "premio" SET NOT NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sorteos" DROP COLUMN "premio"`);
    await queryRunner.query(`ALTER TABLE "partidas" DROP CONSTRAINT "FK_partidas_juego_compatible_puesto"`);
    await queryRunner.query(`ALTER TABLE "partidas" DROP CONSTRAINT "FK_partidas_puesto_evento"`);
    await queryRunner.query(`ALTER TABLE "puestos" DROP CONSTRAINT "UQ_puestos_id_evento"`);
  }
}
