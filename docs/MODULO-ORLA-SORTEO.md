# Módulo de orla y sorteo

## Responsabilidad

Cada papeleta es un registro individual. Las papeletas emitidas comienzan en `CARTERA`; al depositarlas pasan a `ORLA`; la papeleta extraída pasa a `GANADORA`. Las papeletas no depositadas permanecen en la cartera y no participan.

## Operaciones

- **Emitir:** anfitrión responsable o administrador asigna papeletas a una inscripción. No se realiza ningún cobro. La emisión se bloquea al cerrar la orla o al terminar el plazo.
- **Depositar:** el participante autenticado deposita una cantidad de sus papeletas. El bloqueo de la edición y de las filas de cartera mantiene la operación dentro de una transacción. El resto permanece en cartera.
- **Consultar cartera:** devuelve los recuentos de papeletas en cartera y depositadas.
- **Cerrar orla:** el anfitrión responsable o administrador registra `orla_cerrada_en`. Puede cerrarse antes del fin del periodo adicional si ya no hay partidas activas ni papeletas pendientes en las carteras; al vencer el plazo puede cerrarse aunque queden partidas pendientes, pero el sorteo no podrá celebrarse hasta que terminen.
- **Sortear:** anfitrión responsable o administrador, con la orla cerrada, sin partidas activas y con al menos una papeleta depositada. La selección usa aleatoriedad criptográfica y se conserva un único resultado por edición, incluyendo una copia del premio y el instante del sorteo. El evento pasa a FINALIZADO.

## Reglas de integridad

El evento se bloquea al comienzo de cada mutación de la orla. Esto serializa emisión, depósito, cierre y sorteo para impedir que un depósito entre a la vez que se cierra la orla. La papeleta ganadora cambia a `GANADORA` y el sorteo se guarda en la misma transacción. La restricción única por edición impide más de un sorteo.

## Decisiones pendientes

No se ha definido precio, compra, pago ni conversión de ApuchiCoins a papeletas. Por ello, el backend no simula pagos ni descuenta monedas: la emisión es una operación administrativa explícita. Tampoco está implementado el canal de notificaciones en tiempo real; el resultado se consulta mediante HTTP.

## Cierre

La fecha límite se calcula desde `fechaCierreEnfrentamientos` más `duracionPeriodoAdicionalMinutos`. Una vez cerrada la orla no se puede volver a abrir. El sorteo no puede realizarse mientras existan partidas activas.
