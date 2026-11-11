import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Delete } from '@nestjs/common';
import { InscribirParticipanteDto } from './dto/inscribir-participante.dto';
import { ParticipantesService } from './participantes.service';

/** Rutas de inscripción vinculadas a una edición. */
@Controller('eventos/:eventoId/participantes')
export class ParticipantesController {
  constructor(private readonly servicio: ParticipantesService) {}

  @Post()
  inscribir(
    @Param('eventoId', new ParseUUIDPipe()) eventoId: string,
    @Body() datos: InscribirParticipanteDto,
  ) {
    return this.servicio.inscribir(eventoId, datos.usuarioId);
  }

  @Get()
  listar(@Param('eventoId', new ParseUUIDPipe()) eventoId: string) {
    return this.servicio.listar(eventoId);
  }

  @Delete(':participanteId')
  retirar(
    @Param('eventoId', new ParseUUIDPipe()) eventoId: string,
    @Param('participanteId', new ParseUUIDPipe()) participanteId: string,
  ) {
    return this.servicio.retirar(eventoId, participanteId);
  }
}
