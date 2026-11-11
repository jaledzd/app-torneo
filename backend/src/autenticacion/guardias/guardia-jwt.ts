import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { PUBLICO } from '../decoradores/publico.decorator';
/** Exige token salvo que la ruta se marque expresamente como pública. */
@Injectable()
export class GuardiaJwt extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) { super(); }
  canActivate(contexto: ExecutionContext) {
    const publico = this.reflector.getAllAndOverride<boolean>(PUBLICO, [contexto.getHandler(), contexto.getClass()]);
    return publico ? true : super.canActivate(contexto);
  }
}
