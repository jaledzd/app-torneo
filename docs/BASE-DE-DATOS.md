# Base de datos de APUCHITORNEO

## Motor y estrategia

PostgreSQL es la base de datos principal. TypeORM mapea las entidades y ejecuta consultas.

El esquema se controla mediante migraciones versionadas. `synchronize` permanece desactivado para impedir que el servidor altere automáticamente las tablas al arrancar.

## Primera tabla: eventos

| Columna | Tipo PostgreSQL | Descripción |
|---|---|---|
| id | uuid | Identificador de edición. |
| fecha_inicio | timestamptz | Inicio configurado. |
| fecha_cierre_enfrentamientos | timestamptz | Cierre de nuevos enfrentamientos. |
| duracion_periodo_adicional_minutos | integer | Duración de la fase adicional. |
| premio | varchar(250) | Descripción del premio. |
| estado | enum | Fase de la edición. |
| creado_en | timestamptz | Creación automática. |
| actualizado_en | timestamptz | Última modificación automática. |

Restricciones de base de datos:
- Cierre posterior al inicio.
- Duración adicional positiva.
- Estado dentro de los valores permitidos.
- Identificador único.

## Migraciones

La migración inicial crea el tipo enum, la tabla y un índice por estado.

Desde `backend/`:

~~~bash
npm run migration:show
npm run migration:run
npm run migration:revert
~~~

Revisa una migración antes de aplicarla en un entorno compartido y prepara una copia de seguridad apropiada.

## Próximas entidades

El modelo se ampliará después de definir claves y cardinalidades para usuarios, participantes, ediciones, puestos, videojuegos, retos, partidas, movimientos de monedas, papeletas, orla y sorteos.

Las reservas de recursos y operaciones económicas requerirán transacciones y restricciones para soportar peticiones simultáneas. No deben implementarse como lecturas y escrituras independientes.
