import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_PERMITIDOS } from '../decoradores/roles.decorator';
import { UsuarioAutenticado } from '../dominio/usuario-autenticado.interface';
/** Comprueba que la identidad autenticada tenga uno de los roles requeridos. */
@Injectable()
export class GuardiaRoles implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(contexto: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_PERMITIDOS, [contexto.getHandler(), contexto.getClass()]);
    if (!roles?.length) return true;
    const usuario = contexto.switchToHttp().getRequest<{ user?: UsuarioAutenticado }>().user;
    if (!usuario || !roles.includes(usuario.rol)) throw new ForbiddenException('No tienes permisos para realizar esta operación');
    return true;
  }
}
