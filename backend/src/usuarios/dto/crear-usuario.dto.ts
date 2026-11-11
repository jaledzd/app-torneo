import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';

/** Datos mínimos para registrar una cuenta de participante. */
export class CrearUsuarioDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @Length(10, 72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'La contraseña debe incluir minúsculas, mayúsculas y números',
  })
  contrasena: string;

  @IsString()
  @Length(2, 80)
  nombreVisible: string;
}
