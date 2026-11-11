import { ArrayMinSize, ArrayUnique, IsArray, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';

/** Datos de configuración de un puesto y sus juegos admitidos. */
export class CrearPuestoDto {
  @IsString()
  @Length(1, 30)
  codigo: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  descripcion?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  videojuegosIds: string[];
}