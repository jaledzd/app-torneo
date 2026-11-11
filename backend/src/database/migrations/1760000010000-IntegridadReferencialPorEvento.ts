import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Refuerza las relaciones compuestas para impedir que una partida, papeleta,
 * reto o movimiento mezcle participantes y recursos de ediciones distintas.
 */
export class IntegridadReferencialPorEvento1760000010000 implements MigrationInterface {
  name = 'IntegridadReferencialPorEvento1760000010000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "participantes" ADD CONSTRAINT "UQ_participantes_id_evento" UNIQUE ("id", "evento_id")`);
    await queryRunner.query(`ALTER TABLE "partidas" ADD CONSTRAINT "UQ_partidas_id_evento" UNIQUE ("id", "evento_id")`);
    await queryRunner.query(`ALTER TABLE "papeletas" ADD CONSTRAINT "UQ_papeletas_id_evento_participante" UNIQUE ("id", "evento_id", "participante_id")`);

    await queryRunner.query(`ALTER TABLE "partidas" ADD CONSTRAINT "FK_partidas_a_evento" FOREIGN KEY ("participante_a_id", "evento_id") REFERENCES "participantes"("id", "evento_id") ON DELETE RESTRICT`);
    await queryRunner.query(`ALTER TABLE "partidas" ADD CONSTRAINT "FK_partidas_b_evento" FOREIGN KEY ("participante_b_id", "evento_id") REFERENCES "participantes"("id", "evento_id") ON DELETE RESTRICT`);

    await queryRunner.query(`ALTER TABLE "retos" ADD CONSTRAINT "FK_retos_emisor_evento" FOREIGN KEY ("emisor_id", "evento_id") REFERENCES "participantes"("id", "evento_id") ON DELETE RESTRICT`);
    await queryRunner.query(`ALTER TABLE "retos" ADD CONSTRAINT "FK_retos_destinatario_evento" FOREIGN KEY ("destinatario_id", "evento_id") REFERENCES "participantes"("id", "evento_id") ON DELETE RESTRICT`);

    await queryRunner.query(`ALTER TABLE "papeletas" ADD CONSTRAINT "FK_papeletas_participante_evento" FOREIGN KEY ("participante_id", "evento_id") REFERENCES "participantes"("id", "evento_id") ON DELETE RESTRICT`);

    await queryRunner.query(`ALTER TABLE "movimientos_apuchicoins" ADD CONSTRAINT "FK_movimientos_participante_evento" FOREIGN KEY ("participante_id", "evento_id") REFERENCES "participantes"("id", "evento_id") ON DELETE RESTRICT`);
    await queryRunner.query(`ALTER TABLE "movimientos_apuchicoins" ADD CONSTRAINT "FK_movimientos_partida_evento" FOREIGN KEY ("partida_id", "evento_id") REFERENCES "partidas"("id", "evento_id") ON DELETE RESTRICT`);

    await queryRunner.query(`ALTER TABLE "sorteos" ADD CONSTRAINT "FK_sorteos_participante_evento" FOREIGN KEY ("participante_ganador_id", "evento_id") REFERENCES "participantes"("id", "evento_id") ON DELETE RESTRICT`);
    await queryRunner.query(`ALTER TABLE "sorteos" ADD CONSTRAINT "FK_sorteos_papeleta_ganadora" FOREIGN KEY ("papeleta_ganadora_id", "evento_id", "participante_ganador_id") REFERENCES "papeletas"("id", "evento_id", "participante_id") ON DELETE RESTRICT`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sorteos" DROP CONSTRAINT "FK_sorteos_papeleta_ganadora"`);
    await queryRunner.query(`ALTER TABLE "sorteos" DROP CONSTRAINT "FK_sorteos_participante_evento"`);
    await queryRunner.query(`ALTER TABLE "movimientos_apuchicoins" DROP CONSTRAINT "FK_movimientos_partida_evento"`);
    await queryRunner.query(`ALTER TABLE "movimientos_apuchicoins" DROP CONSTRAINT "FK_movimientos_participante_evento"`);
    await queryRunner.query(`ALTER TABLE "papeletas" DROP CONSTRAINT "FK_papeletas_participante_evento"`);
    await queryRunner.query(`ALTER TABLE "retos" DROP CONSTRAINT "FK_retos_destinatario_evento"`);
    await queryRunner.query(`ALTER TABLE "retos" DROP CONSTRAINT "FK_retos_emisor_evento"`);
    await queryRunner.query(`ALTER TABLE "partidas" DROP CONSTRAINT "FK_partidas_b_evento"`);
    await queryRunner.query(`ALTER TABLE "partidas" DROP CONSTRAINT "FK_partidas_a_evento"`);
    await queryRunner.query(`ALTER TABLE "papeletas" DROP CONSTRAINT "UQ_papeletas_id_evento_participante"`);
    await queryRunner.query(`ALTER TABLE "partidas" DROP CONSTRAINT "UQ_partidas_id_evento"`);
    await queryRunner.query(`ALTER TABLE "participantes" DROP CONSTRAINT "UQ_participantes_id_evento"`);
  }
}