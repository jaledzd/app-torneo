import { randomInt } from 'crypto';
import { MigrationInterface, QueryRunner } from 'typeorm';

/** Añade un código numérico privado y único a cada edición existente. */
export class CodigoAccesoEdiciones1760000014000 implements MigrationInterface {
  name = 'CodigoAccesoEdiciones1760000014000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "eventos" ADD COLUMN "codigo_acceso" character varying(6)`);
    const eventos: Array<{ id: string }> = await queryRunner.query(
      `SELECT "id" FROM "eventos" ORDER BY "creado_en" ASC`,
    );
    const usados = new Set<string>();
    for (const evento of eventos) {
      let codigo = '';
      do {
        codigo = String(randomInt(100000, 1000000));
      } while (usados.has(codigo));
      usados.add(codigo);
      await queryRunner.query(
        `UPDATE "eventos" SET "codigo_acceso" = $1 WHERE "id" = $2`,
        [codigo, evento.id],
      );
    }
    await queryRunner.query(`ALTER TABLE "eventos" ALTER COLUMN "codigo_acceso" SET NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_eventos_codigo_acceso" ON "eventos" ("codigo_acceso")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_eventos_codigo_acceso"`);
    await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "codigo_acceso"`);
  }
}
