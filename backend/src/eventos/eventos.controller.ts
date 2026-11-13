import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { UsuarioAutenticado } from '../autenticacion/dominio/usuario-autenticado.interface';
import { RolUsuario } from '../usuarios/dominio/rol-usuario.enum';
import { EventosService } from './eventos.service';
import { CrearEventoDto } from './dto/crear-evento.dto';
import { ActualizarEventoDto } from './dto/actualizar-evento.dto';
import { AsignarAnfitrionDto } from './dto/asignar-anfitrion.dto';

@Controller('eventos')
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  @Roles(RolUsuario.ANFITRION, RolUsuario.ADMINISTRADOR)
  @Post()
  crear(@Body() dto: CrearEventoDto, @Req() req: Request & { user: UsuarioAutenticado }) {
    return this.eventosService.crear(dto, req.user);
  }

  @Roles(RolUsuario.ANFITRION, RolUsuario.ADMINISTRADOR)
  @Get(':id/codigo-acceso')
  obtenerCodigoAcceso(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: Request & { user: UsuarioAutenticado }) {
    return this.eventosService.obtenerCodigoAcceso(id, req.user);
  }

  @Roles(RolUsuario.ANFITRION, RolUsuario.ADMINISTRADOR)
  @Post(':id/codigo-acceso/regenerar')
  regenerarCodigoAcceso(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: Request & { user: UsuarioAutenticado }) {
    return this.eventosService.regenerarCodigoAcceso(id, req.user);
  }

  @Roles(RolUsuario.ADMINISTRADOR)
  @Patch(':id/anfitrion')
  asignarAnfitrion(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: AsignarAnfitrionDto, @Req() req: Request & { user: UsuarioAutenticado }) {
    return this.eventosService.asignarAnfitrion(id, dto, req.user);
  }

  @Get()
  listar() { return this.eventosService.listar(); }

  @Get(':id')
  obtenerPorId(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.eventosService.obtenerPorId(id);
  }

  @Roles(RolUsuario.ANFITRION, RolUsuario.ADMINISTRADOR)
  @Delete(':id')
  eliminar(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: Request & { user: UsuarioAutenticado }) {
    return this.eventosService.eliminar(id, req.user);
  }

  @Roles(RolUsuario.ANFITRION, RolUsuario.ADMINISTRADOR)
  @Patch(':id')
  actualizar(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: ActualizarEventoDto, @Req() req: Request & { user: UsuarioAutenticado }) {
    return this.eventosService.actualizar(id, dto, req.user);
  }

  @Roles(RolUsuario.ANFITRION, RolUsuario.ADMINISTRADOR)
  @Post(':id/iniciar')
  iniciar(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: Request & { user: UsuarioAutenticado }) {
    return this.eventosService.iniciar(id, req.user);
  }

  @Roles(RolUsuario.ANFITRION, RolUsuario.ADMINISTRADOR)
  @Post(':id/cerrar-enfrentamientos')
  cerrarEnfrentamientos(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: Request & { user: UsuarioAutenticado }) {
    return this.eventosService.cerrarEnfrentamientos(id, req.user);
  }
}