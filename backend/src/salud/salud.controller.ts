import { Controller, Get } from '@nestjs/common';
import { Publico } from '../autenticacion/decoradores/publico.decorator';
import { SaludService } from './salud.service';
@Controller('salud')
export class SaludController {
  constructor(private readonly saludService: SaludService) {}
  @Publico()
  @Get()
  obtenerEstado() { return this.saludService.obtenerEstado(); }
}
