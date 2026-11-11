import { MigrationInterface, QueryRunner } from 'typeorm';

/** Crea el catálogo de juegos, los puestos por edición y sus compatibilidades. */
export class CrearCatalogoYPuestos1760000003000 implements MigrationInterface {
  name = 'CrearCatalogoYPuestos1760000003000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "videojuegos" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "nombre" varchar(100) NOT NULL,
        "plataforma" varchar(80),
        "activo" boolean NOT NULL DEFAULT true,
        "creado_en" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_videojuegos_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_videojuegos_nombre" UNIQUE ("nombre")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "puestos" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "evento_id" uuid NOT NULL,
        "codigo" varchar(30) NOT NULL,
        "descripcion" varchar(120),
        "activo" boolean NOT NULL DEFAULT true,
        "creado_en" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_puestos_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_puestos_evento" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_puestos_evento_codigo" UNIQUE ("evento_id", "codigo")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "puestos_videojuegos" (
        "puesto_id" uuid NOT NULL,
        "videojuego_id" uuid NOT NULL,
        CONSTRAINT "PK_puestos_videojuegos" PRIMARY KEY ("puesto_id", "videojuego_id"),
        CONSTRAINT "FK_pv_puesto" FOREIGN KEY ("puesto_id") REFERENCES "puestos"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_pv_videojuego" FOREIGN KEY ("videojuego_id") REFERENCES "videojuegos"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_puestos_evento" ON "puestos" ("evento_id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_puestos_evento"`);
    await queryRunner.query(`DROP TABLE "puestos_videojuegos"`);
    await queryRunner.query(`DROP TABLE "puestos"`);
    await queryRunner.query(`DROP TABLE "videojuegos"`);
  }
}
