import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CrearVideojuegoDto {
  @IsString()
  @Length(2, 100)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  plataforma?: string;
}
