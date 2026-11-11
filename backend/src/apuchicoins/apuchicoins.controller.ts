import { Controller, Get, Param, ParseUUIDPipe, Req } from '@nestjs/common';
import { Request } from 'express';
import { UsuarioAutenticado } from '../autenticacion/dominio/usuario-autenticado.interface';
import { ApuchiCoinsService } from './apuchicoins.service';

@Controller('eventos/:eventoId/apuchicoins')
export class ApuchiCoinsController {
  constructor(private readonly servicio: ApuchiCoinsService) {}

  @Get('mi-saldo')
  saldo(@Param('eventoId', new ParseUUIDPipe()) eventoId: string, @Req() peticion: Request & { user: UsuarioAutenticado }) {
    return this.servicio.consultarSaldo(eventoId, peticion.user.id);
  }

  @Get('mis-movimientos')
  movimientos(@Param('eventoId', new ParseUUIDPipe()) eventoId: string, @Req() peticion: Request & { user: UsuarioAutenticado }) {
    return this.servicio.consultarMovimientosUsuario(eventoId, peticion.user.id);
  }
}
