import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { RolUsuario } from '../usuarios/dominio/rol-usuario.enum';
import { EventosService } from './eventos.service';
import { CrearEventoDto } from './dto/crear-evento.dto';
import { ActualizarEventoDto } from './dto/actualizar-evento.dto';
@Controller('eventos')
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}
  @Roles(RolUsuario.ANFITRION, RolUsuario.ADMINISTRADOR)
  @Post()
  crear(@Body() dto: CrearEventoDto) { return this.eventosService.crear(dto); }
  @Get()
  listar() { return this.eventosService.listar(); }
  @Get(':id')
  obtenerPorId(@Param('id', new ParseUUIDPipe()) id: string) { return this.eventosService.obtenerPorId(id); }
  @Roles(RolUsuario.ANFITRION, RolUsuario.ADMINISTRADOR)
  @Patch(':id')
  actualizar(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: ActualizarEventoDto) { return this.eventosService.actualizar(id, dto); }
  @Roles(RolUsuario.ANFITRION, RolUsuario.ADMINISTRADOR)
  @Post(':id/iniciar')
  iniciar(@Param('id', new ParseUUIDPipe()) id: string) { return this.eventosService.iniciar(id); }
  @Roles(RolUsuario.ANFITRION, RolUsuario.ADMINISTRADOR)
  @Post(':id/cerrar-enfrentamientos')
  cerrarEnfrentamientos(@Param('id', new ParseUUIDPipe()) id: string) { return this.eventosService.cerrarEnfrentamientos(id); }
}
