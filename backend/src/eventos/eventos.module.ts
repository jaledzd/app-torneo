
/**
 * Define los estados posibles de una edición del evento.
 *
 * El estado determina en qué fase se encuentra el evento
 * y qué operaciones se pueden realizar durante esa fase.
 */
export enum EstadoEvento {

    /**
     * El evento está en preparación.
     *
     * El anfitrión puede configurar sus videojuegos,
     * puestos, horarios y premio.
     */
    BORRADOR = 'BORRADOR',

    /**
     * El evento está abierto a los participantes.
     *
     * Se pueden enviar y aceptar retos, iniciar partidas,
     * conseguir ApuchiCoins y comprar papeletas.
     */
    EN_CURSO = 'EN_CURSO',

    /**
     * Ha llegado la hora de cierre de enfrentamientos.
     *
     * No se pueden iniciar nuevos retos, pero las partidas
     * que ya están activas pueden finalizarse.
     *
     * Los participantes también pueden introducir papeletas
     * en la orla mientras esta permanezca abierta.
     */
    PERIODO_ADICIONAL = 'PERIODO_ADICIONAL',

    /**
     * El evento ha terminado.
     *
     * La orla está cerrada y el sorteo ya se ha realizado.
     */
    FINALIZADO = 'FINALIZADO'
}
