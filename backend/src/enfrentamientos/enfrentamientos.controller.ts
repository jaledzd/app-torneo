import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { UsuarioAutenticado } from '../autenticacion/dominio/usuario-autenticado.interface';
import { RolUsuario } from '../usuarios/dominio/rol-usuario.enum';
import { AceptarRetoDto } from './dto/aceptar-reto.dto';
import { CrearRetoDto } from './dto/crear-reto.dto';
import { FinalizarPartidaDto } from './dto/finalizar-partida.dto';
import { EnfrentamientosService } from './enfrentamientos.service';

@Controller('eventos/:eventoId')
export class EnfrentamientosController {
  constructor(private readonly servicio: EnfrentamientosService) {}
  @Post('retos')
  enviarReto(@Param('eventoId', new ParseUUIDPipe()) eventoId: string, @Body() datos: CrearRetoDto, @Req() peticion: Request & { user: UsuarioAutenticado }) {
    return this.servicio.enviarReto(eventoId, peticion.user.id, datos.destinatarioId);
  }
  @Get('retos/recibidos')
  retosRecibidos(@Param('eventoId', new ParseUUIDPipe()) eventoId: string, @Req() peticion: Request & { user: UsuarioAutenticado }) {
    return this.servicio.listarRetosRecibidosPorUsuario(eventoId, peticion.user.id);
  }
  @Post('retos/:retoId/aceptar')
  aceptarReto(@Param('eventoId', new ParseUUIDPipe()) eventoId: string, @Param('retoId', new ParseUUIDPipe()) retoId: string, @Body() datos: AceptarRetoDto, @Req() peticion: Request & { user: UsuarioAutenticado }) {
    return this.servicio.aceptarReto(eventoId, retoId, peticion.user.id, datos.puestoId, datos.videojuegoId);
  }
  @Post('retos/:retoId/rechazar')
  rechazarReto(@Param('eventoId', new ParseUUIDPipe()) eventoId: string, @Param('retoId', new ParseUUIDPipe()) retoId: string, @Req() peticion: Request & { user: UsuarioAutenticado }) {
    return this.servicio.rechazarReto(eventoId, retoId, peticion.user.id);
  }

  @Roles(RolUsuario.ANFITRION, RolUsuario.ADMINISTRADOR)
  @Post('partidas/:partidaId/finalizar')
  finalizarPartida(@Param('eventoId', new ParseUUIDPipe()) eventoId: string, @Param('partidaId', new ParseUUIDPipe()) partidaId: string, @Body() datos: FinalizarPartidaDto, @Req() peticion: Request & { user: UsuarioAutenticado }) {
    return this.servicio.finalizarPartida(eventoId, partidaId, datos.ganadorId, peticion.user);
  }
  @Get('partidas')
  listarPartidas(@Param('eventoId', new ParseUUIDPipe()) eventoId: string) { return this.servicio.listarPartidas(eventoId); }
}
