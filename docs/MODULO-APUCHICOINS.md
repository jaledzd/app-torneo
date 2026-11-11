# Módulo de ApuchiCoins

## Regla inicial

El ganador de cada partida finalizada recibe exactamente una ApuchiCoin. La operación de cierre de partida, incremento del saldo y registro del movimiento debe pertenecer a la misma transacción PostgreSQL.

## Libro mayor

La tabla `movimientos_apuchicoins` conserva cada movimiento. El saldo rápido se mantiene en `participantes.saldo_apuchicoins`, pero el libro mayor permite auditar cómo se ha llegado a ese saldo.

El índice único parcial impide registrar dos recompensas por la misma partida. Los movimientos no se borran para corregir saldos: las correcciones futuras deben ser movimientos compensatorios.

## Implementación

`ApuchiCoinsService.acreditarVictoria` recibe el gestor transaccional de TypeORM. No abre una transacción independiente; así la recompensa no puede quedar registrada si falla el cierre de la partida.
