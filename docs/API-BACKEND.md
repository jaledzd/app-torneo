# API del backend

Base URL local: `http://localhost:3000`.

Todas las rutas requieren JWT Bearer salvo las marcadas explícitamente como públicas. El registro y el inicio de sesión son públicos. Las operaciones de anfitrión y administrador comprueban el rol global del usuario.

## Convenciones

- Fechas ISO 8601 con zona horaria.
- UUID para identificar ediciones y recursos.
- Los DTO rechazan propiedades desconocidas mediante el ValidationPipe global.
- Los errores de reglas de negocio usan códigos HTTP estándar de NestJS.

## Salud y cuentas

- `GET /salud`: estado del servicio (público).
- `POST /usuarios/registro`: registro público; siempre crea rol PARTICIPANTE.
- `POST /autenticacion/iniciar-sesion`: devuelve token Bearer.
- `GET /usuarios` y `GET /usuarios/:id`: solo ADMINISTRADOR.

## Ediciones

- `POST /eventos`: anfitrión/administrador; crea BORRADOR.
- `GET /eventos` y `GET /eventos/:id`: consulta.
- `PATCH /eventos/:id`: anfitrión/administrador; solo BORRADOR.
- `POST /eventos/:id/iniciar`: inicia cuando llega la fecha configurada.
- `POST /eventos/:id/cerrar-enfrentamientos`: anfitrión/administrador; pasa a PERIODO_ADICIONAL cuando se alcanza el cierre.

Ejemplo de creación:

```json
{
  "fechaInicio": "2030-06-10T10:00:00.000Z",
  "fechaCierreEnfrentamientos": "2030-06-10T18:00:00.000Z",
  "duracionPeriodoAdicionalMinutos": 30,
  "premio": "Premio del torneo"
}
```

## Participantes

- `POST /eventos/:eventoId/participantes/inscribirme`: inscripción de la cuenta autenticada.
- `POST /eventos/:eventoId/participantes`: anfitrión/administrador inscribe una cuenta indicando `usuarioId`.
- `GET /eventos/:eventoId/participantes`: anfitrión/administrador consulta inscritos.
- `DELETE /eventos/:eventoId/participantes/:participanteId`: anfitrión/administrador retira una inscripción. No se puede retirar a alguien con partida activa.

## Catálogo y puestos

- `POST /videojuegos`: crear videojuego (anfitrión/administrador).
- `GET /videojuegos`: catálogo activo.
- `POST /eventos/:eventoId/puestos`: crear puesto y definir compatibilidades (anfitrión/administrador).
- `GET /eventos/:eventoId/puestos`: consultar puestos activos.

## Retos y partidas

- `POST /eventos/:eventoId/retos`: enviar reto indicando `destinatarioId` (id de participante).
- `GET /eventos/:eventoId/retos/recibidos`: retos pendientes del usuario autenticado.
- `POST /eventos/:eventoId/retos/:retoId/aceptar`: aceptar indicando `puestoId` y `videojuegoId`.
- `GET /eventos/:eventoId/partidas`: consultar partidas.
- `POST /eventos/:eventoId/partidas/:partidaId/finalizar`: anfitrión/administrador registra `ganadorId`.

Los retos caducan en cinco minutos por defecto (configurable mediante `RETO_CADUCIDAD_MINUTOS`). El cierre horario impide nuevos retos y aceptaciones. Las partidas activas pueden terminar después. Puestos, videojuegos y participantes se reservan dentro de transacciones.

## ApuchiCoins

- `GET /eventos/:eventoId/apuchicoins/mi-saldo`: saldo del usuario autenticado.
- `GET /eventos/:eventoId/apuchicoins/mis-movimientos`: libro de movimientos del usuario.
- Al finalizar una partida se acredita una moneda al ganador en la misma transacción.

## Orla y sorteo

- `POST /eventos/:eventoId/orla/emitir`: anfitrión/administrador; cuerpo `{ "participanteId": "UUID", "cantidad": 3 }`.
- `POST /eventos/:eventoId/orla/depositar`: usuario autenticado; cuerpo `{ "cantidad": 2 }`.
- `GET /eventos/:eventoId/orla/mi-cartera`: recuento de cartera y papeletas depositadas.
- `POST /eventos/:eventoId/orla/sorteo`: anfitrión/administrador; requiere periodo adicional, al menos una papeleta depositada y ninguna partida activa.
- `GET /eventos/:eventoId/orla/sorteo`: resultado persistido.

La duración de la orla se calcula desde la hora configurada de cierre más los minutos de periodo adicional. El sorteo puede hacerse antes de vencer ese periodo si todas las partidas han terminado.

## Limitaciones conocidas

- No se ha definido precio, compra ni conversión de ApuchiCoins en papeletas; la emisión es administrativa y no descuenta saldo.
- El resultado del sorteo se consulta por HTTP; falta implementar la notificación en tiempo real para Expo.
- El rol ANFITRION es global, no está vinculado todavía a una edición concreta.
- No hay todavía paginación, Swagger, rate limiting ni CORS configurado para los orígenes definitivos.
