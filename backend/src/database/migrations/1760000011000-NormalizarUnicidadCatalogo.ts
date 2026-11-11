import { MigrationInterface, QueryRunner } from 'typeorm';

/** Evita duplicados de catálogo que solo difieren en mayúsculas/minúsculas. */
export class NormalizarUnicidadCatalogo1760000011000 implements MigrationInterface {
  name = 'NormalizarUnicidadCatalogo1760000011000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_videojuegos_nombre_sin_distinguir_mayusculas" ON "videojuegos" (LOWER("nombre"))`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_videojuegos_nombre_sin_distinguir_mayusculas"`);
  }
}