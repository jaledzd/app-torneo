import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { RolUsuario } from '../usuarios/dominio/rol-usuario.enum';
import { CrearPuestoDto } from './dto/crear-puesto.dto';
import { PuestosService } from './puestos.service';
@Controller('eventos/:eventoId/puestos')
export class PuestosController {
  constructor(private readonly servicio: PuestosService) {}
  @Roles(RolUsuario.ANFITRION, RolUsuario.ADMINISTRADOR)
  @Post()
  crear(@Param('eventoId', new ParseUUIDPipe()) eventoId: string, @Body() datos: CrearPuestoDto) { return this.servicio.crear(eventoId, datos); }
  @Get()
  listar(@Param('eventoId', new ParseUUIDPipe()) eventoId: string) { return this.servicio.listar(eventoId); }
}
