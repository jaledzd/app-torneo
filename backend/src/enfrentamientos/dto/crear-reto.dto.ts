import { IsUUID } from 'class-validator';
export class CrearRetoDto {
  @IsUUID()
  destinatarioId: string;
}
