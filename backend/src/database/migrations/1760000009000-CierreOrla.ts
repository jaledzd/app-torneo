import { MigrationInterface, QueryRunner } from 'typeorm';

/** Registra el cierre irreversible de la recepción de papeletas de cada edición. */
export class CierreOrla1760000009000 implements MigrationInterface {
  name = 'CierreOrla1760000009000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "eventos" ADD "orla_cerrada_en" timestamptz`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "orla_cerrada_en"`);
  }
}