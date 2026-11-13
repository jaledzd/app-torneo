import { IsString, Matches } from 'class-validator';

/** Código privado de seis dígitos para la autoinscripción. */
export class CodigoAccesoParticipanteDto {
  @IsString()
  @Matches(/^\d{6}$/, { message: 'El código debe tener exactamente 6 dígitos' })
  codigo: string;
}
