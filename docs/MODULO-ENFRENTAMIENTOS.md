# Módulo de retos y partidas

## Reglas

- Los retos solo se envían durante EN_CURSO y antes de la hora de cierre configurada.
- La caducidad predeterminada es de cinco minutos y se configura mediante `RETO_CADUCIDAD_MINUTOS`.
- Un destinatario solo puede tener un reto pendiente vigente.
- Para aceptar, ambos participantes deben seguir inscritos y libres.
- La edición debe continuar EN_CURSO y no haber alcanzado la hora de cierre.
- Se debe elegir un puesto activo y un videojuego compatible con él.
- Puesto, videojuego y jugadores quedan reservados en una única transacción.
- No existe cola de espera: si un recurso está ocupado, la aceptación falla y no se inicia la partida.
- El anfitrión finaliza manualmente y registra a uno de los dos participantes como ganador.
- Una partida activa puede finalizar después del cierre de enfrentamientos.
- Al finalizar, el ganador recibe una ApuchiCoin dentro de la misma transacción.

## Garantías de base de datos

Los índices únicos parciales de `partidas` impiden ocupar dos veces el mismo puesto o videojuego. La tabla `partidas_jugadores_activos` utiliza `participante_id` como clave primaria: impide que una persona figure en dos partidas simultáneas incluso si cambia de la columna jugador A a jugador B. El servicio crea y elimina esas reservas en la misma transacción que inicia o finaliza la partida.

## Rutas

| Método | Ruta | Función |
|---|---|---|
| POST | `/eventos/:eventoId/retos` | Enviar reto a un participante |
| GET | `/eventos/:eventoId/retos/recibidos` | Consultar retos vigentes |
| POST | `/eventos/:eventoId/retos/:retoId/aceptar` | Aceptar y reservar recursos |
| GET | `/eventos/:eventoId/partidas` | Historial de partidas |
| POST | `/eventos/:eventoId/partidas/:partidaId/finalizar` | Finalizar como anfitrión |

## Identidad

El emisor y el destinatario se resuelven como participantes de la edición. El emisor se obtiene de la cuenta autenticada; el destinatario se identifica mediante el id de su inscripción, no mediante una cuenta arbitraria. El identificador del ganador también debe pertenecer a uno de los dos participantes de esa partida.

## Concurrencia

Las operaciones de envío y aceptación bloquean primero la fila de la edición. Así se mantiene un orden de bloqueo común dentro del ciclo de retos. La aceptación reserva los jugadores con una restricción de clave primaria en la tabla auxiliar, además de comprobar la ocupación del puesto y del videojuego.
