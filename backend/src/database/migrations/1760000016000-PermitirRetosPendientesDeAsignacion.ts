import { MigrationInterface, QueryRunner } from 'typeorm';

/** Añade el estado para retos aceptados que esperan un puesto y juego libres. */
export class PermitirRetosPendientesDeAsignacion1760000016000
  implements MigrationInterface
{
  name = 'PermitirRetosPendientesDeAsignacion1760000016000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "retos_estado_enum" ADD VALUE IF NOT EXISTS 'PENDIENTE_ASIGNACION'`,
    );
  }

  async down(): Promise<void> {
    // PostgreSQL no permite retirar de forma segura un valor de un ENUM.
    // Se conserva el valor para evitar reconstruir el tipo y arriesgar datos.
  }
}
