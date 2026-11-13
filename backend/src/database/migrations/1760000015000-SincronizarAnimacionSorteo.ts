import { MigrationInterface, QueryRunner } from 'typeorm';

/** Guarda las marcas temporales compartidas que sincronizan la animación del sorteo en todos los dispositivos. */
export class SincronizarAnimacionSorteo1760000015000 implements MigrationInterface {
  name = 'SincronizarAnimacionSorteo1760000015000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sorteos" ADD COLUMN "animacion_inicio_en" timestamptz`);
    await queryRunner.query(`ALTER TABLE "sorteos" ADD COLUMN "revelar_en" timestamptz`);
    await queryRunner.query(`
      UPDATE "sorteos"
      SET "animacion_inicio_en" = "realizado_en",
          "revelar_en" = "realizado_en"
    `);
    await queryRunner.query(`ALTER TABLE "sorteos" ALTER COLUMN "animacion_inicio_en" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "sorteos" ALTER COLUMN "revelar_en" SET NOT NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sorteos" DROP COLUMN "revelar_en"`);
    await queryRunner.query(`ALTER TABLE "sorteos" DROP COLUMN "animacion_inicio_en"`);
  }
}
