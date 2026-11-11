import { IsUUID } from 'class-validator';
export class AceptarRetoDto {
  @IsUUID()
  puestoId: string;
  @IsUUID()
  videojuegoId: string;
}
