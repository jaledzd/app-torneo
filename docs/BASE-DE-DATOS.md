# Base de datos

## Motor y estrategia

La base de datos principal es PostgreSQL. TypeORM se utiliza como ORM para mapear entidades y ejecutar consultas.

El esquema se controla mediante migraciones versionadas. La opción `synchronize` permanece desactivada para evitar que el servidor altere el esquema automáticamente al arrancar.

## Primera entidad: eventos

| Columna | Tipo PostgreSQL | Descripción |
|---|---|---|
| id | uuid | Identificador de la edición. |
| fecha_inicio | timestamptz | Inicio configurado. |
| fecha_cierre_enfrentamientos | timestamptz | Momento a partir del cual no se inician retos. |
| duracion_periodo_adicional_minutos | integer | Duración de la fase adicional. |
| premio | varchar(250) | Descripción del premio. |
| estado | enum | Fase actual de la edición. |
| creado_en | timestamptz | Fecha de creación automática. |
| actualizado_en | timestamptz | Última modificación automática. |

Restricciones:
- El cierre de enfrentamientos debe ser posterior al inicio.
- La duración adicional debe ser positiva.
- El estado solo puede tomar los valores del enum definido.
- El identificador es único.

## Migraciones

La primera migración crea el tipo enum, la tabla y un índice por estado.

Comandos desde `backend/`:

~~~bash
npm run migration:show
npm run migration:run
npm run migration:revert
~~~

Antes de ejecutar una migración en un entorno compartido, se debe revisar su contenido y disponer de una copia de seguridad apropiada.

## Próximas entidades

El modelo se ampliará después de definir claves y cardinalidades para participantes, ediciones, puestos, videojuegos, retos, partidas, movimientos de monedas, papeletas, orla y sorteos.

Las operaciones económicas y las reservas de recursos necesitarán transacciones y restricciones para soportar peticiones concurrentes. No se debe implementar esa parte como simples lecturas y escrituras independientes.
