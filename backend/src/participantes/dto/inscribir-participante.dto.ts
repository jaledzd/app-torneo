import { IsString, Matches } from 'class-validator';

/** Código privado que acredita la invitación a una edición. */
export class InscribirParticipanteDto {
  @IsString()
  @Matches(/^\\d{6}$/, { message: 'El código debe tener exactamente 6 dígitos' })
  codigo: string;
}
