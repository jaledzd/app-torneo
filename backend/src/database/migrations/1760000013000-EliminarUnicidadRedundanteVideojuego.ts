import { MigrationInterface, QueryRunner } from 'typeorm';

/** El índice funcional de la migración 1100 ya cubre la unicidad sin distinguir mayúsculas. */
export class EliminarUnicidadRedundanteVideojuego1760000013000 implements MigrationInterface {
  name = 'EliminarUnicidadRedundanteVideojuego1760000013000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "videojuegos" DROP CONSTRAINT "UQ_videojuegos_nombre"`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "videojuegos" ADD CONSTRAINT "UQ_videojuegos_nombre" UNIQUE ("nombre")`);
  }
}
