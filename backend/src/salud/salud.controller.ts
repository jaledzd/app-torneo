
import { Controller, Get } from '@nestjs/common';
import { SaludService } from './salud.service';

@Controller('salud')
export class SaludController {

    constructor(
        private readonly saludService: SaludService
    ) {}

    @Get()
    obtenerEstado() {
        return this.saludService.obtenerEstado();
    }

}
