import { IsUUID } from 'class-validator';

/** Identificador de la cuenta que el anfitrión desea inscribir. */
export class InscribirParticipanteDto {
  @IsUUID()
  usuarioId: string;
}
