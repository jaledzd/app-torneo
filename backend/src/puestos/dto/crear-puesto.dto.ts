import { IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';

export class CrearPuestoDto {
  @IsString()
  @Length(1, 30)
  codigo: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  descripcion?: string;

  @IsUUID('4', { each: true })
  videojuegosIds: string[];
}
