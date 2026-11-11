import { SetMetadata } from '@nestjs/common';
import { RolUsuario } from '../../usuarios/dominio/rol-usuario.enum';
export const ROLES_PERMITIDOS = 'roles_permitidos';
export const Roles = (...roles: RolUsuario[]) => SetMetadata(ROLES_PERMITIDOS, roles);
