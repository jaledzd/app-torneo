import { MigrationInterface, QueryRunner } from 'typeorm';

/** Asocia cada edición a su responsable. Las ediciones anteriores requieren asignación administrativa. */
export class VincularAnfitrionAEvento1760000008000 implements MigrationInterface {
  name = 'VincularAnfitrionAEvento1760000008000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "eventos" ADD "anfitrion_id" uuid`);
    await queryRunner.query(`ALTER TABLE "eventos" ADD CONSTRAINT "FK_eventos_anfitrion" FOREIGN KEY ("anfitrion_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT`);
    await queryRunner.query(`CREATE INDEX "IDX_eventos_anfitrion" ON "eventos" ("anfitrion_id")`);
    await queryRunner.query(`COMMENT ON COLUMN "eventos"."anfitrion_id" IS 'Responsable de la edición; las filas antiguas deben asignarse antes de volver a administrarse'`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_eventos_anfitrion"`);
    await queryRunner.query(`ALTER TABLE "eventos" DROP CONSTRAINT "FK_eventos_anfitrion"`);
    await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "anfitrion_id"`);
  }
}