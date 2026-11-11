import { Body, Controller, Get, Post } from '@nestjs/common';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { RolUsuario } from '../usuarios/dominio/rol-usuario.enum';
import { CrearVideojuegoDto } from './dto/crear-videojuego.dto';
import { VideojuegosService } from './videojuegos.service';
@Controller('videojuegos')
export class VideojuegosController {
  constructor(private readonly servicio: VideojuegosService) {}
  @Roles(RolUsuario.ANFITRION, RolUsuario.ADMINISTRADOR)
  @Post()
  crear(@Body() datos: CrearVideojuegoDto) { return this.servicio.crear(datos); }
  @Get()
  listar() { return this.servicio.listar(); }
}
