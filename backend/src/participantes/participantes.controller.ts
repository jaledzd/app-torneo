import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { UsuarioAutenticado } from '../autenticacion/dominio/usuario-autenticado.interface';
import { RolUsuario } from '../usuarios/dominio/rol-usuario.enum';
import { InscribirParticipanteDto } from './dto/inscribir-participante.dto';
import { ParticipantesService } from './participantes.service';

@Controller('eventos/:eventoId/participantes')
export class ParticipantesController {
  constructor(private readonly servicio: ParticipantesService) {}

  @Post('inscribirme')
  inscribirme(@Param('eventoId', new ParseUUIDPipe()) eventoId: string, @Req() peticion: Request & { user: UsuarioAutenticado }) {
    return this.servicio.inscribir(eventoId, peticion.user.id);
  }

  @Roles(RolUsuario.ANFITRION, RolUsuario.ADMINISTRADOR)
  @Post()
  inscribir(@Param('eventoId', new ParseUUIDPipe()) eventoId: string, @Body() datos: InscribirParticipanteDto) {
    return this.servicio.inscribir(eventoId, datos.usuarioId);
  }

  @Roles(RolUsuario.ANFITRION, RolUsuario.ADMINISTRADOR)
  @Get()
  listar(@Param('eventoId', new ParseUUIDPipe()) eventoId: string) {
    return this.servicio.listar(eventoId);
  }

  @Roles(RolUsuario.ANFITRION, RolUsuario.ADMINISTRADOR)
  @Delete(':participanteId')
  retirar(@Param('eventoId', new ParseUUIDPipe()) eventoId: string, @Param('participanteId', new ParseUUIDPipe()) participanteId: string) {
    return this.servicio.retirar(eventoId, participanteId);
  }
}
