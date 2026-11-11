# API del backend

Base URL local: `http://localhost:3000`.

Los ejemplos usan JSON. Las rutas de eventos se encuentran en desarrollo y todavía no tienen autenticación; no deben exponerse a Internet como API de producción hasta implementar autorización de anfitrión.

## Convenciones

- Las fechas se envían como cadenas ISO 8601 con zona horaria, por ejemplo `2030-06-10T10:00:00.000Z`.
- Los identificadores de evento son UUID.
- Los errores usan el formato estándar de excepciones HTTP de NestJS.
- Los DTO rechazan propiedades desconocidas gracias al ValidationPipe global.
- La API devuelve los campos persistidos de la entidad. Más adelante se introducirán DTO de respuesta para controlar explícitamente la representación pública.

## Salud

### GET /salud

Comprueba que el proceso HTTP responde.

Respuesta orientativa:

~~~json
{
  "estado": "ok",
  "mensaje": "La API está funcionando correctamente",
  "entorno": "development"
}
~~~

## Eventos

### POST /eventos

Crea una edición en estado BORRADOR.

Petición:

~~~json
{
  "fechaInicio": "2030-06-10T10:00:00.000Z",
  "fechaCierreEnfrentamientos": "2030-06-10T18:00:00.000Z",
  "duracionPeriodoAdicionalMinutos": 30,
  "premio": "Premio del torneo"
}
~~~

Validaciones:
- Ambas fechas deben ser ISO 8601.
- La fecha de cierre debe ser posterior al inicio.
- La duración del periodo adicional debe ser un entero positivo.
- El premio debe ser texto no vacío y no superar 250 caracteres.
- El identificador y el estado inicial los establece el backend.

### GET /eventos

Lista las ediciones, de más reciente a más antigua.

### GET /eventos/:id

Devuelve una edición por UUID. Respuestas: 200 si existe, 400 si el UUID no tiene formato válido, 404 si no existe.

### PATCH /eventos/:id

Modifica parcialmente la configuración. Solo se permiten cambios mientras el estado sea BORRADOR.

Ejemplo:

~~~json
{
  "premio": "Premio actualizado",
  "duracionPeriodoAdicionalMinutos": 45
}
~~~

### POST /eventos/:id/iniciar

Transición prevista de BORRADOR a EN_CURSO. Solo debe permitirse cuando llegue la fecha de inicio configurada.

## Códigos HTTP habituales

| Código | Significado |
|---|---|
| 200 | Consulta o modificación correcta. |
| 201 | Recurso creado. |
| 400 | DTO inválido o regla de negocio incumplida. |
| 404 | Edición inexistente. |
| 500 | Error interno no esperado. |

## Pendiente antes de producción

- Autenticación y autorización de anfitrión.
- DTO de respuesta para no exponer campos internos.
- Paginación y filtros en listados.
- Documentación OpenAPI/Swagger.
- Rate limiting y políticas de CORS.
- Pruebas HTTP y de integración con PostgreSQL real.
