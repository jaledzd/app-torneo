import { IsUUID } from 'class-validator';
export class FinalizarPartidaDto {
  @IsUUID()
  ganadorId: string;
}
