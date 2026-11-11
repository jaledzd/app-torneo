# Base de datos de APUCHITORNEO

## Motor y estrategia

PostgreSQL es la base de datos principal. TypeORM mapea las entidades y ejecuta consultas.

El esquema se controla mediante migraciones versionadas. `synchronize` permanece desactivado para impedir que el servidor altere automáticamente las tablas al arrancar.

## Ediciones

| Columna | Tipo PostgreSQL | Descripción |
|---|---|---|
| id | uuid | Identificador de edición. |
| anfitrion_id | uuid, nullable para datos heredados | Usuario responsable de la edición. |
| fecha_inicio | timestamptz | Inicio configurado. |
| fecha_cierre_enfrentamientos | timestamptz | Cierre de nuevos enfrentamientos. |
| duracion_periodo_adicional_minutos | integer | Duración de la fase adicional. |
| premio | varchar(250) | Descripción del premio. |
| estado | enum | Fase de la edición. |
| orla_cerrada_en | timestamptz, nullable | Instante de cierre irreversible de la orla. |
| creado_en | timestamptz | Creación automática. |
| actualizado_en | timestamptz | Última modificación automática. |

Restricciones y reglas:
- Cierre posterior al inicio.
- Duración adicional positiva.
- Estado dentro de los valores permitidos.
- El anfitrión referencia una cuenta existente y no se elimina mientras tenga ediciones.
- Los eventos creados después de la migración guardan anfitrión. Las ediciones anteriores quedan sin responsable asignado y requieren asignación administrativa explícita mediante `PATCH /eventos/:id/anfitrion`.

## Migraciones

Las migraciones se ejecutan en orden cronológico. Las migraciones `1760000008000` y `1760000009000` añaden, respectivamente, el responsable de edición y el instante de cierre de orla sin reescribir el historial anterior. Las migraciones `1760000010000` y `1760000011000` refuerzan las relaciones entre registros de una misma edición y evitan duplicados de videojuegos por diferencias de mayúsculas/minúsculas.

Desde `backend/`:

~~~powershell
npm run migration:show
npm run migration:run
npm run migration:revert
~~~

Revisa una migración antes de aplicarla en un entorno compartido y prepara una copia de seguridad apropiada.
