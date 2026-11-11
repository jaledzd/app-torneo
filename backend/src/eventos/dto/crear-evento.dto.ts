
import {
    IsDateString,
    IsInt,
    IsNotEmpty,
    IsString,
    Min
} from 'class-validator';

/**
 * Define los datos necesarios para crear una nueva edición
 * del evento.
 *
 * Esta clase representa la información que puede enviar
 * el anfitrión al endpoint de creación.
 *
 * No incluye el identificador ni el estado porque ambos
 * serán responsabilidad del backend.
 */
export class CrearEventoDto {

    /**
     * Fecha y hora previstas para el comienzo del evento.
     *
     * Se recibe como una cadena de fecha en formato ISO 8601.
     */
    @IsDateString()
    fechaInicio: string;

    /**
     * Fecha y hora a partir de la cual se cerrarán
     * los nuevos enfrentamientos.
     */
    @IsDateString()
    fechaCierreEnfrentamientos: string;

    /**
     * Duración máxima del periodo adicional, expresada
     * en minutos.
     *
     * Debe ser un número entero mayor que cero.
     */
    @IsInt()
    @Min(1)
    duracionPeriodoAdicionalMinutos: number;

    /**
     * Descripción del premio que se sorteará en esta edición.
     *
     * No puede ser una cadena vacía.
     */
    @IsString()
    @IsNotEmpty()
    premio: string;
}
