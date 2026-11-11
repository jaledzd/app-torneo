import { IsDateString, IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

/** Datos de entrada para crear una edición. El servidor genera id y estado. */
export class CrearEventoDto {
  @IsDateString()
  fechaInicio: string;

  @IsDateString()
  fechaCierreEnfrentamientos: string;

  @IsInt()
  @Min(1)
  duracionPeriodoAdicionalMinutos: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  premio: string;
}
