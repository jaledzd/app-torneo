
import { Injectable } from '@nestjs/common';

@Injectable()
export class SaludService {

    obtenerEstado() {
        return {
            estado: 'ok',
            mensaje: 'La API está funcionando correctamente',
            entorno: process.env.NODE_ENV ?? 'desarrollo'
        };
    }

}
