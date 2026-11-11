import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { UsuariosService } from './usuarios.service';

/** Rutas públicas de registro y consulta básica de cuentas. */
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly servicio: UsuariosService) {}

  @Post('registro')
  registrar(@Body() datos: CrearUsuarioDto) {
    return this.servicio.registrar(datos);
  }

  @Get()
  listar() {
    return this.servicio.listar();
  }

  @Get(':id')
  obtener(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.servicio.obtener(id);
  }
}
