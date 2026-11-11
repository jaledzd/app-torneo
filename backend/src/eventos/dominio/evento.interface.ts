
import { EstadoEvento } from './estado-evento.enum';

/**
 * Representa una edición concreta del evento.
 *
 * Cada edición mantiene su propia configuración y sus propios
 * participantes, partidas, ApuchiCoins, papeletas y sorteo.
 *
 * Esta interfaz define la estructura de los datos del evento.
 */
export interface Evento {

    /**
     * Identificador único de la edición.
     */
    id: string;

    /**
     * Fecha y hora en la que comienza el evento.
     */
    fechaInicio: Date;

    /**
     * Fecha y hora a partir de la cual no se permiten
     * nuevos enfrentamientos.
     */
    fechaCierreEnfrentamientos: Date;

    /**
     * Duración del periodo adicional en minutos.
     *
     * Este valor lo configura el anfitrión antes de iniciar
     * el evento.
     */
    duracionPeriodoAdicionalMinutos: number;

    /**
     * Descripción del premio configurado para esta edición.
     */
    premio: string;

    /**
     * Estado actual de la edición.
     */
    estado: EstadoEvento;
}
