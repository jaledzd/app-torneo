import { IsUUID } from 'class-validator';

/** Cuenta ANFITRION que quedará como responsable de la edición. */
export class AsignarAnfitrionDto {
  @IsUUID('4')
  anfitrionId: string;
}