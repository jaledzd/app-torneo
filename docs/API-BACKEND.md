# API del backend

Base URL local: `http://localhost:3000`.

Las rutas de escritura todavía no tienen autenticación ni autorización de anfitrión. No expongas el backend a Internet como API de producción hasta implementar esos controles.

## Convenciones

- Fechas ISO 8601 con zona horaria.
- UUID para identificar ediciones.
- Excepciones HTTP estándar de NestJS.
- Los DTO rechazan propiedades desconocidas mediante el ValidationPipe global.

## Salud

### GET /salud

Comprueba que el proceso HTTP responde.

~~~json
{
  "estado": "ok",
  "mensaje": "La API está funcionando correctamente",
  "entorno": "development"
}
~~~

## Ediciones

### POST /eventos

Crea una edición en estado BORRADOR.

~~~json
{
  "fechaInicio": "2030-06-10T10:00:00.000Z",
  "fechaCierreEnfrentamientos": "2030-06-10T18:00:00.000Z",
  "duracionPeriodoAdicionalMinutos": 30,
  "premio": "Premio del torneo"
}
~~~

Reglas: fechas ISO válidas, cierre posterior al inicio, duración entera positiva y premio de texto no vacío (máximo 250 caracteres). El identificador y estado inicial los genera el servidor.

### GET /eventos

Lista ediciones de más reciente a más antigua.

### GET /eventos/:id

Consulta una edición por UUID.

### PATCH /eventos/:id

Modifica parcialmente la configuración, únicamente mientras la edición siga en BORRADOR.

~~~json
{
  "premio": "Premio actualizado",
  "duracionPeriodoAdicionalMinutos": 45
}
~~~

### POST /eventos/:id/iniciar

Cambia BORRADOR a EN_CURSO cuando la fecha de inicio configurada ya ha llegado. No se permite iniciar anticipadamente.

### POST /eventos/:id/cerrar-enfrentamientos

Cambia EN_CURSO a PERIODO_ADICIONAL cuando se alcanza la fecha de cierre. Las partidas que ya estén activas podrán terminar; la gestión de esas partidas se implementará en el módulo correspondiente.

## Respuestas HTTP

| Código | Significado |
|---|---|
| 200 | Consulta o modificación correcta. |
| 201 | Recurso creado. |
| 400 | DTO inválido o regla de negocio incumplida. |
| 404 | Edición inexistente. |
| 500 | Error interno no esperado. |

## Pendiente

- Autenticación y autorización de anfitrión.
- DTO explícitos de respuesta.
- Paginación y filtros.
- OpenAPI/Swagger.
- Limitación de peticiones, CORS y cabeceras de seguridad.
- Pruebas de integración con PostgreSQL real.
