# Módulo de participantes

## Concepto

Un usuario es una cuenta global. Un participante es la inscripción de esa cuenta en una edición concreta. Esta separación permite que una persona participe en varias ediciones sin mezclar historiales ni saldos.

## Reglas implementadas

- Una cuenta activa puede inscribirse en una edición en BORRADOR o EN_CURSO.
- No se permiten nuevas inscripciones durante el periodo adicional ni después.
- Una edición no admite dos inscripciones simultáneas de la misma cuenta.
- Una inscripción retirada puede reactivarse conservando su identidad.
- El saldo inicial de ApuchiCoins es cero.
- La inscripción se ejecuta dentro de una transacción y bloquea la fila de la edición para serializar el control de su fase.

## Rutas

| Método | Ruta | Acción |
|---|---|---|
| POST | `/eventos/:eventoId/participantes` | Inscribir mediante `usuarioId` |
| GET | `/eventos/:eventoId/participantes` | Listar inscripciones activas |
| DELETE | `/eventos/:eventoId/participantes/:participanteId` | Retirar inscripción |

## Integridad

PostgreSQL garantiza una inscripción por pareja edición-cuenta mediante una restricción UNIQUE y evita saldos negativos mediante CHECK. Las claves foráneas impiden inscripciones huérfanas.

## Autorización pendiente

El controlador todavía no está protegido por identidad autenticada. Antes de un despliegue público se debe limitar la inscripción/retirada al propio participante o a un anfitrión autorizado.
