import { MigrationInterface, QueryRunner } from 'typeorm';

/** Crea retos y partidas con índices únicos parciales para recursos ocupados. */
export class CrearRetosYPartidas1760000004000 implements MigrationInterface {
  name = 'CrearRetosYPartidas1760000004000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "retos_estado_enum" AS ENUM ('PENDIENTE', 'ACEPTADO', 'RECHAZADO', 'CADUCADO')`);
    await queryRunner.query(`CREATE TYPE "partidas_estado_enum" AS ENUM ('EN_CURSO', 'FINALIZADA')`);
    await queryRunner.query(`
      CREATE TABLE "partidas" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "evento_id" uuid NOT NULL,
        "participante_a_id" uuid NOT NULL,
        "participante_b_id" uuid NOT NULL,
        "puesto_id" uuid NOT NULL,
        "videojuego_id" uuid NOT NULL,
        "estado" "partidas_estado_enum" NOT NULL DEFAULT 'EN_CURSO',
        "ganador_id" uuid,
        "iniciada_en" timestamptz NOT NULL DEFAULT now(),
        "finalizada_en" timestamptz,
        "creada_en" timestamptz NOT NULL DEFAULT now(),
        "actualizada_en" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_partidas_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_partidas_evento" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_partidas_a" FOREIGN KEY ("participante_a_id") REFERENCES "participantes"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_partidas_b" FOREIGN KEY ("participante_b_id") REFERENCES "participantes"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_partidas_puesto" FOREIGN KEY ("puesto_id") REFERENCES "puestos"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_partidas_juego" FOREIGN KEY ("videojuego_id") REFERENCES "videojuegos"("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_partidas_jugadores_distintos" CHECK ("participante_a_id" <> "participante_b_id"),
        CONSTRAINT "CHK_partidas_ganador" CHECK ("ganador_id" IS NULL OR "ganador_id" IN ("participante_a_id", "participante_b_id")),
        CONSTRAINT "CHK_partidas_cierre" CHECK (("estado" = 'EN_CURSO' AND "finalizada_en" IS NULL AND "ganador_id" IS NULL) OR ("estado" = 'FINALIZADA' AND "finalizada_en" IS NOT NULL AND "ganador_id" IS NOT NULL))
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_partidas_puesto_activo" ON "partidas" ("puesto_id") WHERE "estado" = 'EN_CURSO'`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_partidas_juego_activo" ON "partidas" ("videojuego_id") WHERE "estado" = 'EN_CURSO'`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_partidas_jugador_a_activo" ON "partidas" ("participante_a_id") WHERE "estado" = 'EN_CURSO'`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_partidas_jugador_b_activo" ON "partidas" ("participante_b_id") WHERE "estado" = 'EN_CURSO'`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_partidas_jugador_cruzado_activo" ON "partidas" ("participante_a_id", "participante_b_id") WHERE "estado" = 'EN_CURSO'`);
    await queryRunner.query(`
      CREATE TABLE "retos" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "evento_id" uuid NOT NULL,
        "emisor_id" uuid NOT NULL,
        "destinatario_id" uuid NOT NULL,
        "estado" "retos_estado_enum" NOT NULL DEFAULT 'PENDIENTE',
        "caduca_en" timestamptz NOT NULL,
        "partida_id" uuid,
        "creado_en" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_retos_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_retos_evento" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_retos_emisor" FOREIGN KEY ("emisor_id") REFERENCES "participantes"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_retos_destinatario" FOREIGN KEY ("destinatario_id") REFERENCES "participantes"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_retos_partida" FOREIGN KEY ("partida_id") REFERENCES "partidas"("id") ON DELETE SET NULL,
        CONSTRAINT "CHK_retos_jugadores" CHECK ("emisor_id" <> "destinatario_id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_retos_destinatario_pendiente" ON "retos" ("evento_id", "destinatario_id") WHERE "estado" = 'PENDIENTE'`);
    await queryRunner.query(`CREATE INDEX "IDX_retos_caducidad" ON "retos" ("caduca_en") WHERE "estado" = 'PENDIENTE'`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_retos_caducidad"`);
    await queryRunner.query(`DROP INDEX "UQ_retos_destinatario_pendiente"`);
    await queryRunner.query(`DROP TABLE "retos"`);
    await queryRunner.query(`DROP INDEX "UQ_partidas_jugador_cruzado_activo"`);
    await queryRunner.query(`DROP INDEX "UQ_partidas_jugador_b_activo"`);
    await queryRunner.query(`DROP INDEX "UQ_partidas_jugador_a_activo"`);
    await queryRunner.query(`DROP INDEX "UQ_partidas_juego_activo"`);
    await queryRunner.query(`DROP INDEX "UQ_partidas_puesto_activo"`);
    await queryRunner.query(`DROP TABLE "partidas"`);
    await queryRunner.query(`DROP TYPE "partidas_estado_enum"`);
    await queryRunner.query(`DROP TYPE "retos_estado_enum"`);
  }
}
