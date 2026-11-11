import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { Publico } from '../autenticacion/decoradores/publico.decorator';
import { RolUsuario } from './dominio/rol-usuario.enum';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { UsuariosService } from './usuarios.service';
/** Registro público y consultas reservadas al equipo administrador. */
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly servicio: UsuariosService) {}
  @Publico()
  @Post('registro')
  registrar(@Body() datos: CrearUsuarioDto) { return this.servicio.registrar(datos); }
  @Roles(RolUsuario.ADMINISTRADOR)
  @Get()
  listar() { return this.servicio.listar(); }
  @Roles(RolUsuario.ADMINISTRADOR)
  @Get(':id')
  obtener(@Param('id', new ParseUUIDPipe()) id: string) { return this.servicio.obtener(id); }
}
