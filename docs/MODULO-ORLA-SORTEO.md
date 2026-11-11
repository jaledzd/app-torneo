# Módulo de orla y sorteo

## Responsabilidad

Cada papeleta es un registro individual. Las papeletas emitidas comienzan en `CARTERA`; al depositarlas pasan a `ORLA`; la papeleta extraída pasa a `GANADORA`. Las papeletas no depositadas permanecen en la cartera y no participan.

## Operaciones

- **Emitir:** anfitrión o administrador asigna papeletas a una inscripción. No se realiza ningún cobro.
- **Depositar:** el participante autenticado deposita una cantidad de sus papeletas. El bloqueo de la edición y de las filas de cartera mantiene la operación dentro de una transacción.
- **Consultar cartera:** devuelve los recuentos de papeletas en cartera y depositadas.
- **Sortear:** anfitrión o administrador, durante el periodo adicional, cuando no quedan partidas activas y hay papeletas depositadas. La selección usa aleatoriedad criptográfica y se conserva un único resultado por edición. El evento pasa a FINALIZADO.

## Decisiones pendientes

No se ha definido precio, compra, pago ni conversión de ApuchiCoins a papeletas. Por ello, el backend no simula pagos ni descuenta monedas: la emisión es una operación administrativa explícita. Tampoco está implementado el canal de notificaciones en tiempo real; el resultado se consulta mediante HTTP.

## Cierre

La duración del periodo adicional se calcula desde `fechaCierreEnfrentamientos` más `duracionPeriodoAdicionalMinutos`. El anfitrión puede sortear antes del límite si todas las partidas han terminado. No se permite depositar papeletas una vez superado el límite.
