import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { UsuarioAutenticado } from '../autenticacion/dominio/usuario-autenticado.interface';
import { RolUsuario } from '../usuarios/dominio/rol-usuario.enum';
import { CrearPapeletasDto } from './dto/crear-papeletas.dto';
import { DepositarPapeletasDto } from './dto/depositar-papeletas.dto';
import { OrlaService } from './orla.service';

@Controller('eventos/:eventoId/orla')
export class OrlaController {
  constructor(private readonly servicio: OrlaService) {}

  @Roles(RolUsuario.ANFITRION, RolUsuario.ADMINISTRADOR)
  @Post('emitir')
  emitir(@Param('eventoId', new ParseUUIDPipe()) eventoId: string, @Body() datos: CrearPapeletasDto, @Req() req: Request & { user: UsuarioAutenticado }) {
    return this.servicio.emitir(eventoId, datos.participanteId, datos.cantidad, req.user);
  }

  @Post('depositar')
  depositar(@Param('eventoId', new ParseUUIDPipe()) eventoId: string, @Body() datos: DepositarPapeletasDto, @Req() peticion: Request & { user: UsuarioAutenticado }) {
    return this.servicio.depositar(eventoId, peticion.user.id, datos.cantidad);
  }

  @Get('mi-cartera')
  consultar(@Param('eventoId', new ParseUUIDPipe()) eventoId: string, @Req() peticion: Request & { user: UsuarioAutenticado }) {
    return this.servicio.consultar(eventoId, peticion.user.id);
  }

  @Roles(RolUsuario.ANFITRION, RolUsuario.ADMINISTRADOR)
  @Post('cerrar')
  cerrar(@Param('eventoId', new ParseUUIDPipe()) eventoId: string, @Req() req: Request & { user: UsuarioAutenticado }) {
    return this.servicio.cerrarOrla(eventoId, req.user);
  }

  @Roles(RolUsuario.ANFITRION, RolUsuario.ADMINISTRADOR)
  @Post('sorteo')
  sortear(@Param('eventoId', new ParseUUIDPipe()) eventoId: string, @Req() req: Request & { user: UsuarioAutenticado }) {
    return this.servicio.realizarSorteo(eventoId, req.user);
  }

  @Get('sorteo')
  resultado(@Param('eventoId', new ParseUUIDPipe()) eventoId: string) {
    return this.servicio.obtenerSorteo(eventoId);
  }
}