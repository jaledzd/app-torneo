import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { EventosService } from './eventos.service';
import { CrearEventoDto } from './dto/crear-evento.dto';
import { ActualizarEventoDto } from './dto/actualizar-evento.dto';

/** Endpoints HTTP de gestión de ediciones. La autorización de anfitrión
 * se incorporará al implementar identidad y autenticación. */
@Controller('eventos')
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  /** Crea una edición en estado BORRADOR. */
  @Post()
  crear(@Body() dto: CrearEventoDto) {
    return this.eventosService.crear(dto);
  }

  /** Lista ediciones, de la más reciente a la más antigua. */
  @Get()
  listar() {
    return this.eventosService.listar();
  }

  /** Obtiene una edición por su UUID. */
  @Get(':id')
  obtenerPorId(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.eventosService.obtenerPorId(id);
  }

  /** Actualiza la configuración mientras la edición esté en BORRADOR. */
  @Patch(':id')
  actualizar(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: ActualizarEventoDto) {
    return this.eventosService.actualizar(id, dto);
  }

  /** Inicia una edición previamente configurada. */
  @Post(':id/iniciar')
  iniciar(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.eventosService.iniciar(id);
  }
}
