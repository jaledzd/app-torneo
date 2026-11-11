# Requisitos funcionales de APUCHITORNEO

## 1. Propósito

APUCHITORNEO gestiona un torneo presencial de videojuegos. El sistema organiza cada edición, participantes, retos, partidas, recursos físicos, recompensas, papeletas, orla y sorteo.

Este documento recoge las reglas funcionales acordadas. Es la referencia para implementar backend, aplicación móvil y pruebas de aceptación.

## 2. Actores

### Participante
- Consulta la información de la edición.
- Gestiona su disponibilidad.
- Envía y recibe retos.
- Consulta partidas activas e historial.
- Consulta su saldo de ApuchiCoins.
- Compra o recibe papeletas y decide cuántas deposita en la orla.

### Anfitrión
- Configura la edición, horarios, puestos, videojuegos y premio.
- Supervisa disponibilidad y enfrentamientos.
- Finaliza partidas y registra ganadores.
- Controla el periodo adicional, el cierre de la orla y el sorteo.

## 3. Ciclo de vida de una edición

1. **Configuración:** el anfitrión define fechas, horarios, puestos, videojuegos, duración del periodo adicional y premio.
2. **En curso:** se permiten retos, enfrentamientos y operaciones de papeletas previstas para esta fase.
3. **Cierre de enfrentamientos:** llegada la hora establecida, no se permiten nuevos retos ni aceptar solicitudes que todavía no hayan comenzado. Las partidas activas pueden continuar.
4. **Periodo adicional / orla abierta:** se pueden terminar partidas activas y depositar papeletas en la orla. La duración es configurable por edición.
5. **Sorteo:** el anfitrión puede iniciar el sorteo cuando todos hayan terminado de jugar y colocar papeletas; no es obligatorio consumir todo el tiempo adicional.
6. **Finalizado:** se conserva el resultado y el historial.

## 4. Solicitudes de reto

- El plazo inicial de aceptación es de **5 minutos** y debe poder configurarse.
- Si no se acepta a tiempo, la solicitud expira.
- Mientras un jugador tenga una solicitud entrante pendiente, no puede recibir otra hasta aceptar o rechazar la primera.
- Emisor y destinatario deben estar disponibles.
- Al aceptar, ambos quedan ocupados hasta que el anfitrión finalice la partida.
- Cuando se cierra el periodo de enfrentamientos, no se aceptan retos pendientes que aún no hayan comenzado.

## 5. Inicio y disponibilidad de partidas

Para iniciar una partida deben cumplirse simultáneamente estas condiciones:

- Ambos jugadores están disponibles.
- Existe un puesto físico libre.
- Existe un videojuego compatible y libre.
- La edición todavía permite iniciar enfrentamientos.

Si alguna condición falla, la partida no comienza. No se crea una cola para iniciar automáticamente cuando se libere un recurso.

La disponibilidad del puesto físico y la del videojuego son independientes. Un videojuego solo puede estar asignado a una pareja a la vez, incluso si existen varias consolas compatibles.

## 6. Finalización y recompensas

- El anfitrión finaliza manualmente la partida.
- El anfitrión registra al ganador.
- El ganador recibe una ApuchiCoin.
- Una partida iniciada antes del cierre puede finalizar durante el periodo adicional.

## 7. Papeletas y orla

- Un participante puede tener varias papeletas en su cartera.
- Al depositarlas, elige la cantidad.
- Las papeletas no depositadas permanecen en su cartera.
- Al cerrar la orla, las papeletas depositadas quedan bloqueadas para el sorteo.
- Las papeletas que permanecen en la cartera no participan.

## 8. Sorteo

La primera versión contempla un único premio y un único ganador. El diseño debe permitir evolución futura sin introducir complejidad innecesaria ahora.

El resultado debe comunicarse en tiempo real a los móviles que estén utilizando la aplicación.

## 9. Configuración por edición

El anfitrión configura los horarios y la duración del periodo adicional para cada edición. Las ediciones deben conservar sus propios participantes, partidas, monedas, papeletas y resultado.

## 10. Requisitos de integridad y concurrencia

La implementación debe impedir, incluso cuando dos peticiones llegan simultáneamente:

- Reservar dos veces el mismo puesto.
- Asignar el mismo videojuego a dos partidas activas.
- Iniciar partidas con jugadores ocupados.
- Conceder dos veces la misma recompensa.
- Alterar saldos de monedas de forma inconsistente.
- Duplicar depósitos o papeletas.
- Ejecutar el sorteo más de una vez.

Estas garantías deben resolverse en el backend y en la base de datos mediante operaciones atómicas, transacciones, restricciones y controles de idempotencia cuando corresponda. No basta con deshabilitar botones en la aplicación móvil.
