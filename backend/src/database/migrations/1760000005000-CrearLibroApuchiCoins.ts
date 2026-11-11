import { MigrationInterface, QueryRunner } from 'typeorm';
/** Libro mayor con una única recompensa de victoria por partida. */
export class CrearLibroApuchiCoins1760000005000 implements MigrationInterface {
  name = 'CrearLibroApuchiCoins1760000005000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "movimientos_apuchicoins" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "evento_id" uuid NOT NULL,
        "participante_id" uuid NOT NULL,
        "partida_id" uuid,
        "cantidad" integer NOT NULL,
        "motivo" varchar(30) NOT NULL,
        "creado_en" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_movimientos_apuchicoins" PRIMARY KEY ("id"),
        CONSTRAINT "FK_movimientos_evento" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_movimientos_participante" FOREIGN KEY ("participante_id") REFERENCES "participantes"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_movimientos_partida" FOREIGN KEY ("partida_id") REFERENCES "partidas"("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_movimientos_cantidad" CHECK ("cantidad" <> 0),
        CONSTRAINT "CHK_movimientos_motivo" CHECK ("motivo" IN ('VICTORIA_PARTIDA', 'AJUSTE_ADMINISTRATIVO'))
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_movimiento_victoria_partida" ON "movimientos_apuchicoins" ("partida_id") WHERE "motivo" = 'VICTORIA_PARTIDA'`);
    await queryRunner.query(`CREATE INDEX "IDX_movimientos_participante" ON "movimientos_apuchicoins" ("evento_id", "participante_id", "creado_en")`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_movimientos_participante"`);
    await queryRunner.query(`DROP INDEX "UQ_movimiento_victoria_partida"`);
    await queryRunner.query(`DROP TABLE "movimientos_apuchicoins"`);
  }
}
