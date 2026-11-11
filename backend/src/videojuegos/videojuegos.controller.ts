import { Body, Controller, Get, Post } from '@nestjs/common';
import { CrearVideojuegoDto } from './dto/crear-videojuego.dto';
import { VideojuegosService } from './videojuegos.service';

@Controller('videojuegos')
export class VideojuegosController {
  constructor(private readonly servicio: VideojuegosService) {}

  @Post()
  crear(@Body() datos: CrearVideojuegoDto) {
    return this.servicio.crear(datos);
  }

  @Get()
  listar() {
    return this.servicio.listar();
  }
}
