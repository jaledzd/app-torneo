# API del backend

Base URL local: `http://localhost:3000`.

Todas las rutas requieren JWT Bearer salvo las marcadas expresamente como públicas. El registro y el inicio de sesión son públicos. El rol global permite acceder a las operaciones de anfitrión, pero **cada edición tiene además un anfitrión responsable**: solo esa cuenta o un ADMINISTRADOR puede modificarla, iniciar/cerrar fases, emitir papeletas, cerrar la orla o finalizar partidas y sortear.

## Convenciones

- Fechas ISO 8601 con zona horaria.
- UUID para identificar ediciones y recursos.
- Los DTO rechazan propiedades desconocidas mediante el ValidationPipe global.
- Los errores de reglas de negocio usan códigos HTTP estándar de NestJS.
- Las mutaciones que afectan a varios recursos se ejecutan en transacciones PostgreSQL y bloquean primero la edición.

## Salud y cuentas

- `GET /salud`: estado del servicio (público).
- `POST /usuarios/registro`: registro público; siempre crea rol PARTICIPANTE.
- `POST /autenticacion/iniciar-sesion`: devuelve token Bearer.
- `GET /usuarios` y `GET /usuarios/:id`: solo ADMINISTRADOR.

## Ediciones

- `POST /eventos`: anfitrión/administrador; crea BORRADOR y asigna como responsable al usuario autenticado.
- `GET /eventos` y `GET /eventos/:id`: consulta de ediciones.
- `PATCH /eventos/:id/anfitrion`: solo ADMINISTRADOR; asigna o reasigna el responsable indicando `anfitrionId` de una cuenta activa con rol ANFITRION.
- `PATCH /eventos/:id`: responsable/administrador; solo BORRADOR.
- `POST /eventos/:id/iniciar`: responsable/administrador; inicia cuando llega la fecha configurada.
- `POST /eventos/:id/cerrar-enfrentamientos`: responsable/administrador; pasa a PERIODO_ADICIONAL cuando se alcanza el cierre.

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
- `GET /eventos/:eventoId/participantes`: consulta de inscritos.
- `DELETE /eventos/:eventoId/participantes/:participanteId`: retirada de una inscripción. No se puede retirar a alguien con partida activa ni modificar inscripciones de una edición finalizada.

## Catálogo y puestos

- `POST /videojuegos`: crear videojuego (anfitrión/administrador).
- `GET /videojuegos`: catálogo activo.
- `POST /eventos/:eventoId/puestos`: crear puesto y definir compatibilidades (anfitrión/administrador).
- `GET /eventos/:eventoId/puestos`: consultar puestos activos.

## Retos y partidas

- `POST /eventos/:eventoId/retos`: enviar reto indicando `destinatarioId` (id de participante).
- `GET /eventos/:eventoId/retos/recibidos`: retos pendientes del usuario autenticado.
- `POST /eventos/:eventoId/retos/:retoId/aceptar`: aceptar indicando `puestoId` y `videojuegoId`.
- `POST /eventos/:eventoId/retos/:retoId/rechazar`: rechazo por el destinatario.
- `GET /eventos/:eventoId/partidas`: consultar partidas.
- `POST /eventos/:eventoId/partidas/:partidaId/finalizar`: responsable/administrador registra `ganadorId`.

Los retos caducan en cinco minutos por defecto (configurable mediante `RETO_CADUCIDAD_MINUTOS`). El cierre horario impide nuevos retos y aceptaciones. Las partidas activas pueden terminar después. Puestos, videojuegos y participantes se reservan dentro de transacciones. Una respuesta a un reto vencido lo marca como CADUCADO.

## ApuchiCoins

- `GET /eventos/:eventoId/apuchicoins/mi-saldo`: saldo del usuario autenticado.
- `GET /eventos/:eventoId/apuchicoins/mis-movimientos`: libro de movimientos del usuario autenticado.
- Al finalizar una partida se acredita una moneda al ganador en la misma transacción.

## Orla y sorteo

- `POST /eventos/:eventoId/orla/emitir`: responsable/administrador; cuerpo `{ "participanteId": "UUID", "cantidad": 3 }`.
- `POST /eventos/:eventoId/orla/depositar`: usuario autenticado; cuerpo `{ "cantidad": 2 }`.
- `GET /eventos/:eventoId/orla/mi-cartera`: recuento de cartera y papeletas depositadas.
- `POST /eventos/:eventoId/orla/cerrar`: responsable/administrador cierra la recepción de papeletas. Puede hacerlo antes de finalizar el periodo adicional si ya no quedan partidas activas ni papeletas pendientes en las carteras; si el periodo ha vencido, puede cerrar aunque queden partidas, pero el sorteo seguirá bloqueado hasta que terminen.
- `POST /eventos/:eventoId/orla/sorteo`: responsable/administrador; exige orla cerrada, al menos una papeleta depositada y ninguna partida activa.
- `GET /eventos/:eventoId/orla/sorteo`: resultado persistido.

La duración máxima de la orla se calcula desde la hora de cierre de enfrentamientos más los minutos de periodo adicional. El anfitrión puede cerrar antes de ese límite cuando ya no hay partidas activas. Una vez cerrada, no se admiten depósitos ni nuevas emisiones. El sorteo es único por edición y finaliza el evento.

## Limitaciones conocidas

- No se ha definido precio, compra ni conversión de ApuchiCoins en papeletas; la emisión es administrativa y no descuenta saldo.
- El resultado del sorteo y los cambios se consultan por HTTP; falta implementar notificación en tiempo real para Expo.
- Las ediciones existentes antes de la migración de anfitrión quedan con `anfitrion_id = NULL`; un administrador debe asignarles responsable antes de que ese anfitrión pueda gestionarlas.
- La transición horaria se persiste cuando se ejecuta una operación que sincroniza la fase; aún no hay un planificador en segundo plano.
- No hay todavía paginación, Swagger, rate limiting ni CORS configurado para los orígenes definitivos.
