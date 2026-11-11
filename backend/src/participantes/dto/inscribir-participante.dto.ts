import { IsUUID } from 'class-validator';

/** Identificador de la cuenta que se desea inscribir en la edición. */
export class InscribirParticipanteDto {
  @IsUUID()
  usuarioId: string;
}
