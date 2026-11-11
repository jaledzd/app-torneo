# Backend de APUCHITORNEO

API de APUCHITORNEO desarrollada con **NestJS 12, TypeScript, PostgreSQL y TypeORM**.

El backend centraliza las reglas del torneo. El cliente móvil no decide si un reto, una partida, una recompensa o un sorteo son válidos: el servidor debe comprobarlo.

## Estado real

- NestJS y configuración global de validación.
- Endpoint de salud `GET /salud`.
- PostgreSQL configurado mediante variables de entorno.
- TypeORM con migraciones; `synchronize` permanece desactivado.
- Entidad, migración y CRUD inicial de ediciones.
- Pruebas unitarias del servicio y pruebas HTTP con servicios simulados.
- **Pendiente:** regenerar `package-lock.json` tras incorporar dependencias y ejecutar build/pruebas en un entorno Node compatible.
- **Pendiente:** autenticación y autorización. Las rutas de escritura actuales no están protegidas; no exponer esta API públicamente.

## Requisitos

- Node.js **22.22.3 o superior** para la cadena de herramientas actualmente fijada.
- npm.
- Docker Desktop (recomendado para levantar PostgreSQL local).

## Preparar entorno local

Desde la carpeta `backend/`:

~~~bash
cp .env.example .env
~~~

En PowerShell:

~~~powershell
Copy-Item .env.example .env
~~~

Los valores de ejemplo son únicamente para desarrollo local. No uses estas credenciales en un entorno compartido o productivo.

Arranca PostgreSQL:

~~~bash
docker compose up -d postgres
~~~

Instala las dependencias y sincroniza el lockfile:

~~~bash
npm install
~~~

Compila y ejecuta las migraciones:

~~~bash
npm run build
npm run migration:run
~~~

Inicia la API:

~~~bash
npm run start:dev
~~~

La API escucha por defecto en `http://localhost:3000`.

## Comandos

| Comando | Propósito |
|---|---|
| `npm run start:dev` | Servidor de desarrollo con recarga. |
| `npm run build` | Compila el backend. |
| `npm run start:prod` | Ejecuta la versión compilada. |
| `npm run test` | Pruebas unitarias. |
| `npm run test:e2e` | Pruebas HTTP end-to-end aisladas de PostgreSQL. |
| `npm run test:cov` | Cobertura de pruebas. |
| `npm run lint` | Análisis estático. |
| `npm run migration:show` | Muestra migraciones pendientes/aplicadas. |
| `npm run migration:run` | Aplica migraciones. |
| `npm run migration:revert` | Revierte la última migración. |

## Configuración

Variables disponibles en `.env.example`:

| Variable | Uso |
|---|---|
| NODE_ENV | Entorno de ejecución. |
| PORT | Puerto HTTP. |
| DB_HOST | Servidor PostgreSQL. |
| DB_PORT | Puerto PostgreSQL. |
| DB_USERNAME | Usuario de base de datos. |
| DB_PASSWORD | Contraseña de base de datos. |
| DB_DATABASE | Nombre de base de datos. |

## Arquitectura del código

- `main.ts`: crea la aplicación, registra pipes globales e inicia el servidor.
- `app.module.ts`: módulo raíz.
- `database/`: conexión TypeORM, DataSource de CLI y migraciones.
- `salud/`: comprobación HTTP del proceso.
- `eventos/`: controlador, servicio, DTO, enum y entidad de ediciones.

El controlador traduce HTTP a llamadas de aplicación. El servicio aplica reglas de negocio. La entidad representa la tabla persistida. Los DTO validan los datos de entrada. Las migraciones versionan el esquema.

## Endpoints implementados

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/salud` | Estado del proceso HTTP. |
| POST | `/eventos` | Crear edición en BORRADOR. |
| GET | `/eventos` | Listar ediciones. |
| GET | `/eventos/:id` | Consultar edición. |
| PATCH | `/eventos/:id` | Editar configuración en BORRADOR. |
| POST | `/eventos/:id/iniciar` | Pasar a EN_CURSO cuando llega la fecha de inicio. |
| POST | `/eventos/:id/cerrar-enfrentamientos` | Pasar a PERIODO_ADICIONAL al llegar al cierre. |

La referencia de peticiones, respuestas y errores está en [API-BACKEND.md](../docs/API-BACKEND.md).

## Validación global

El `ValidationPipe` utiliza:

- `whitelist: true`: descarta propiedades que no estén declaradas en el DTO.
- `forbidNonWhitelisted: true`: rechaza propiedades desconocidas.
- `transform: true`: transforma valores a los tipos definidos cuando corresponde.

Las validaciones entre varios campos y las transiciones de estado se comprueban en el servicio.

## Migraciones y persistencia

No se utiliza `synchronize: true`. La estructura de PostgreSQL se modifica mediante migraciones revisables y versionadas.

Consulta [BASE-DE-DATOS.md](../docs/BASE-DE-DATOS.md) para entender la primera tabla, sus restricciones y los comandos de migración.

## Documentación de aprendizaje

- [Requisitos funcionales](../docs/REQUISITOS-FUNCIONALES.md)
- [Arquitectura](../docs/ARQUITECTURA.md)
- [Modelo de datos](../docs/BASE-DE-DATOS.md)
- [Referencia de API](../docs/API-BACKEND.md)

Cada módulo nuevo debe incluir explicación de responsabilidades, reglas, endpoints, errores y pruebas.
