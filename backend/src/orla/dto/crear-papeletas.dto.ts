import { IsInt, IsUUID, Max, Min } from 'class-validator';
export class CrearPapeletasDto {
  @IsUUID() participanteId: string;
  @IsInt() @Min(1) @Max(500) cantidad: number;
}
