import { Body, Controller, Post } from '@nestjs/common';
import { Publico } from './decoradores/publico.decorator';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto';
import { AutenticacionService } from './autenticacion.service';
@Controller('autenticacion')
export class AutenticacionController {
  constructor(private readonly servicio: AutenticacionService) {}
  @Publico()
  @Post('iniciar-sesion')
  iniciarSesion(@Body() datos: IniciarSesionDto) { return this.servicio.iniciarSesion(datos); }
}
