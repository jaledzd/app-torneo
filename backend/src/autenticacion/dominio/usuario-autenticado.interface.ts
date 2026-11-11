import { RolUsuario } from '../../usuarios/dominio/rol-usuario.enum';
/** Identidad mínima extraída de un token validado. */
export interface UsuarioAutenticado {
  id: string;
  email: string;
  rol: RolUsuario;
}
