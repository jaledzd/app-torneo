# Módulo de retos y partidas

## Reglas

- Los retos solo se envían durante EN_CURSO.
- La caducidad predeterminada es de cinco minutos y se configura mediante `RETO_CADUCIDAD_MINUTOS`.
- Un destinatario solo puede tener un reto pendiente.
- Para aceptar, ambos participantes deben seguir inscritos y libres.
- La edición debe continuar EN_CURSO.
- Se debe elegir un puesto activo y un videojuego compatible con él.
- Puesto, videojuego y jugadores quedan reservados en una única transacción.
- No existe cola de espera: si un recurso está ocupado, la aceptación falla y no se inicia la partida.
- El anfitrión finaliza manualmente y registra a uno de los dos participantes como ganador.
- Una partida activa no se invalida por el mero hecho de que llegue el cierre de enfrentamientos; podrá finalizarse después.

## Garantías de base de datos

Los índices únicos parciales impiden que dos partidas activas ocupen el mismo puesto, videojuego o plaza de jugador. Son una segunda barrera además de las comprobaciones transaccionales del servicio.

## Rutas

| Método | Ruta | Función |
|---|---|---|
| POST | `/eventos/:eventoId/retos` | Enviar reto a un participante |
| GET | `/eventos/:eventoId/retos/recibidos` | Consultar retos pendientes |
| POST | `/eventos/:eventoId/retos/:retoId/aceptar` | Aceptar y reservar recursos |
| GET | `/eventos/:eventoId/partidas` | Historial de partidas |
| POST | `/eventos/:eventoId/partidas/:partidaId/finalizar` | Finalizar como anfitrión |

## Identidad

El participante que envía o acepta el reto se obtiene a partir de la identidad autenticada. El identificador del destinatario del reto corresponde al participante de esa edición, no a una cuenta arbitraria.
