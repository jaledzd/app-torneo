import { SetMetadata } from '@nestjs/common';
/** Marca rutas accesibles sin token de acceso. */
export const PUBLICO = 'ruta_publica';
export const Publico = () => SetMetadata(PUBLICO, true);
