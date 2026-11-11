# Módulo de ApuchiCoins

## Regla inicial

El ganador de cada partida finalizada recibe exactamente una ApuchiCoin. El cierre de partida, el incremento del saldo y el registro del movimiento se ejecutan dentro de la misma transacción PostgreSQL.

## Libro mayor

La tabla `movimientos_apuchicoins` conserva cada movimiento. El saldo rápido se mantiene en `participantes.saldo_apuchicoins`, mientras que el libro mayor permite auditar cómo se ha llegado a ese saldo.

El índice único parcial impide registrar dos recompensas por la misma partida. Los movimientos no se borran para corregir saldos: las correcciones futuras deben ser movimientos compensatorios.

## Implementación

`ApuchiCoinsService.acreditarVictoria` recibe el gestor transaccional de TypeORM. No abre una transacción independiente; así la recompensa no puede quedar registrada si falla el cierre de la partida.

El participante autenticado puede consultar:
- `GET /eventos/:eventoId/apuchicoins/mi-saldo`
- `GET /eventos/:eventoId/apuchicoins/mis-movimientos`

La primera versión no permite gastar monedas ni convertirlas en papeletas porque esa regla económica todavía no se ha definido.
