import { IsDateString, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/** Campos opcionales para editar una edición que aún está en BORRADOR. */
export class ActualizarEventoDto {
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaCierreEnfrentamientos?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duracionPeriodoAdicionalMinutos?: number;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  premio?: string;
}
