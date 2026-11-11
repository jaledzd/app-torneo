# Backend de APUCHITORNEO

API de APUCHITORNEO desarrollada con **NestJS 12, TypeScript, PostgreSQL y TypeORM**.

El backend centraliza las reglas del torneo. El cliente móvil Expo no decide si un reto, una partida, una recompensa o un sorteo son válidos: el servidor comprueba las reglas y persiste los cambios.

## Estado del backend

Implementado en la rama `develop`:

- Autenticación mediante JWT y contraseñas derivadas con scrypt.
- Autorización global por roles y rutas públicas explícitas.
- Registro de cuentas y autoinscripción en ediciones.
- Gestión de ediciones, catálogo de videojuegos y puestos compatibles.
- Retos con caducidad, aceptación y creación transaccional de partidas.
- Reservas independientes de jugadores, puestos y videojuegos.
- Finalización manual de partidas y recompensa de una ApuchiCoin al ganador.
- Cartera de ApuchiCoins y consulta del libro de movimientos.
- Emisión administrativa de papeletas, depósito por participantes y sorteo único.
- Migraciones PostgreSQL; `synchronize` permanece desactivado.
- Documentación funcional y técnica por módulos.

## Pendiente de decisiones o integración

- No está definido el precio ni el mecanismo de compra de papeletas; la emisión actual es administrativa y no descuenta monedas.
- Falta el canal de notificaciones en tiempo real para Expo. El resultado del sorteo y los cambios se pueden consultar por HTTP.
- El rol ANFITRION es global y aún no está vinculado a una edición concreta.
- Falta definir el mecanismo de alta/promoción segura de anfitriones y administradores.
- Swagger, rate limiting, CORS de los orígenes definitivos y paginación.
- Preparar el adaptador de persistencia/ejecución para AWS Lambda, RDS Proxy y Secrets Manager.

## Requisitos

- Node.js **22.22.3 o superior**.
- npm.
- Docker Desktop recomendado para PostgreSQL local.

## Preparar entorno local

Desde `backend/`, crea el archivo de entorno:

```powershell
Copy-Item .env.example .env
```

Los valores de ejemplo son únicamente para desarrollo local. No uses esas credenciales en un entorno compartido o productivo.

Arranca PostgreSQL:

```powershell
docker compose up -d postgres
```

Instala las dependencias (el usuario debe sincronizar el lockfile localmente):

```powershell
npm install
```

Aplica las migraciones e inicia la API:

```powershell
npm run migration:run
npm run start:dev
```

La API escucha por defecto en `http://localhost:3000`.

## Comandos disponibles

| Comando | Propósito |
|---|---|
| `npm run start:dev` | Servidor de desarrollo con recarga. |
| `npm run build` | Compila el backend. |
| `npm run start:prod` | Ejecuta la versión compilada. |
| `npm run test` | Pruebas unitarias. |
| `npm run test:e2e` | Pruebas HTTP end-to-end. |
| `npm run lint` | Análisis estático. |
| `npm run migration:show` | Muestra migraciones pendientes/aplicadas. |
| `npm run migration:run` | Aplica migraciones. |
| `npm run migration:revert` | Revierte la última migración. |

## Variables de entorno

Consulta `.env.example`: `NODE_ENV`, `PORT`, `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` y `JWT_SECRETO`. El secreto JWT debe tener al menos 32 caracteres.

## Organización

- `src/autenticacion/`: JWT, estrategia, guardias y decoradores.
- `src/usuarios/`: cuentas y roles.
- `src/eventos/`: ciclo de vida de las ediciones.
- `src/participantes/`: inscripciones por edición.
- `src/videojuegos/` y `src/puestos/`: catálogo y recursos físicos.
- `src/enfrentamientos/`: retos y partidas.
- `src/apuchicoins/`: saldo y libro mayor.
- `src/orla/`: papeletas y sorteo.
- `src/database/`: conexión, DataSource y migraciones.

## Documentación para estudiar

- [Requisitos funcionales](../docs/REQUISITOS-FUNCIONALES.md)
- [Arquitectura](../docs/ARQUITECTURA.md)
- [Modelo de datos](../docs/BASE-DE-DATOS.md)
- [Referencia de API](../docs/API-BACKEND.md)
- [Retos y partidas](../docs/MODULO-ENFRENTAMIENTOS.md)
- [ApuchiCoins](../docs/MODULO-APUCHICOINS.md)
- [Orla y sorteo](../docs/MODULO-ORLA-SORTEO.md)

El patrón general es: controlador HTTP -> servicio de aplicación -> entidades/repositorios -> PostgreSQL. Las reglas que afectan a varios recursos deben ejecutarse en una misma transacción.
