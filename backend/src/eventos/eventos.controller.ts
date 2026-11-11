import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { EventosService } from './eventos.service';
import { CrearEventoDto } from './dto/crear-evento.dto';
import { ActualizarEventoDto } from './dto/actualizar-evento.dto';

/**
 * API HTTP de ediciones.
 * Las rutas de escritura deberán protegerse con rol de anfitrión cuando
 * se integre el módulo de autenticación.
 */
@Controller('eventos')
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  /** Crea una edición nueva en BORRADOR. */
  @Post()
  crear(@Body() dto: CrearEventoDto) {
    return this.eventosService.crear(dto);
  }

  /** Lista las ediciones existentes. */
  @Get()
  listar() {
    return this.eventosService.listar();
  }

  /** Consulta una edición por UUID. */
  @Get(':id')
  obtenerPorId(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.eventosService.obtenerPorId(id);
  }

  /** Modifica una edición que todavía esté en BORRADOR. */
  @Patch(':id')
  actualizar(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: ActualizarEventoDto) {
    return this.eventosService.actualizar(id, dto);
  }

  /** Inicia la edición cuando llega su fecha de inicio configurada. */
  @Post(':id/iniciar')
  iniciar(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.eventosService.iniciar(id);
  }

  /** Cierra nuevos enfrentamientos y abre el periodo adicional. */
  @Post(':id/cerrar-enfrentamientos')
  cerrarEnfrentamientos(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.eventosService.cerrarEnfrentamientos(id);
  }
}
