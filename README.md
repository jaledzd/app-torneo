# APUCHITORNEO

Aplicación móvil y backend para gestionar un torneo presencial de videojuegos: ediciones, participantes, retos, partidas, puestos de juego, ApuchiCoins, papeletas, orla y sorteo final.

> **Estado actual:** backend en construcción. Ya se ha incorporado la configuración inicial de PostgreSQL/TypeORM, la entidad y migración de eventos, endpoints básicos de gestión de ediciones y pruebas iniciales. La ejecución de build y pruebas queda pendiente de validarse en CI. Expo y el despliegue AWS siguen pendientes.

## Índice

- [Objetivo y perfiles](#objetivo-y-perfiles)
- [Funcionalidades](#funcionalidades)
- [Reglas de negocio](#reglas-de-negocio)
- [Tecnologías y arquitectura](#tecnologías-y-arquitectura)
- [Estructura actual](#estructura-actual)
- [Estado de implementación](#estado-de-implementación)
- [Puesta en marcha](#puesta-en-marcha)
- [Documentación y ruta de estudio](#documentación-y-ruta-de-estudio)
- [Git](#git)

## Objetivo y perfiles

Digitalizar la organización de un torneo presencial. La aplicación contempla dos perfiles:

- **Participante:** consultar el evento, gestionar disponibilidad, retar a otros jugadores, consultar partidas e historial, administrar ApuchiCoins y papeletas, y participar en la orla.
- **Anfitrión:** configurar cada edición, controlar puestos y videojuegos, supervisar retos y partidas, registrar resultados, conceder recompensas y cerrar el sorteo.

El proyecto se desarrollará con documentación técnica suficiente para poder estudiarlo y reproducirlo posteriormente.

## Funcionalidades

1. Gestión de ediciones, horarios, puestos, videojuegos y premio.
2. Gestión de participantes y disponibilidad.
3. Envío, aceptación, rechazo y caducidad de retos.
4. Asignación exclusiva de jugadores, puestos y videojuegos a partidas.
5. Registro de resultados e historial.
6. Gestión de ApuchiCoins y papeletas.
7. Orla y sorteo final.
8. Notificaciones en tiempo real.
9. Aplicación móvil para participantes y anfitrión.

## Reglas de negocio

Estas reglas deben validarse en el backend. La interfaz móvil no será la autoridad sobre el estado del torneo.

- Una solicitud de reto dispone inicialmente de **5 minutos** para ser aceptada; el plazo será configurable.
- Mientras un jugador tenga una solicitud entrante pendiente, no podrá recibir otra hasta aceptar o rechazar la primera.
- Tanto quien reta como quien recibe deben estar disponibles.
- Para iniciar una partida deben estar disponibles ambos jugadores, un puesto físico y un videojuego compatible que no esté en uso.
- Un videojuego solo puede estar asignado a una pareja a la vez, aunque existan varias consolas compatibles.
- Si no hay recursos disponibles, la partida no comienza. No se iniciará automáticamente mediante una cola cuando se libere un recurso.
- El anfitrión finaliza la partida y registra al ganador. El ganador recibe una ApuchiCoin.
- Al llegar la hora de cierre no se inician nuevos enfrentamientos ni se aceptan retos pendientes que todavía no hayan comenzado. Las partidas ya iniciadas pueden terminar.
- Durante el periodo adicional se pueden terminar partidas activas y colocar papeletas en la orla.
- La duración del periodo adicional se configura por edición. El anfitrión puede iniciar el sorteo antes de que termine si todos han acabado de jugar y colocar papeletas.
- Al cerrar la orla, las papeletas depositadas quedan bloqueadas para el sorteo. Las que sigan en la cartera no participan.
- La primera versión contempla un premio y un ganador.

### Fases del evento

| Estado | Comportamiento |
|---|---|
| BORRADOR | El anfitrión configura la edición. |
| EN_CURSO | Se permiten retos, partidas y operaciones de papeletas previstas para esta fase. |
| PERIODO_ADICIONAL | No se inician nuevos enfrentamientos; se terminan partidas activas y se completa la orla. |
| FINALIZADO | La orla está cerrada y el sorteo se ha realizado. |

El sorteo puede ejecutarse antes de que venza el periodo adicional si el anfitrión confirma que todo está listo.

## Tecnologías y arquitectura

| Área | Tecnología | Situación |
|---|---|---|
| Backend | Node.js, TypeScript y NestJS | Inicializado |
| API | API REST | En desarrollo |
| Base de datos | PostgreSQL | Configuración inicial añadida; falta validar conexión y migraciones |
| ORM | TypeORM | Configuración inicial añadida |
| Aplicación móvil | Expo / React Native | Pendiente |
| Tiempo real | WebSocket o mecanismo equivalente | Pendiente de diseño |
| Infraestructura | AWS Serverless | Fase posterior |
| Infraestructura como código | Terraform | Fase posterior |

### Arquitectura objetivo

La aplicación móvil consumirá una API centralizada. El backend aplicará las reglas de negocio y PostgreSQL será la fuente principal de persistencia.

Para el despliegue se estudiará AWS API Gateway, Lambda, RDS PostgreSQL, RDS Proxy, VPC, IAM y Secrets Manager. La comunicación en tiempo real permitirá notificar retos, cambios de partidas y resultados del sorteo.

Esta es la arquitectura objetivo, no infraestructura ya desplegada. No se crearán recursos ni costes de AWS hasta aprobar expresamente esa fase.

### Decisiones importantes

- PostgreSQL será la base de datos principal; no se utilizará DynamoDB como sustituto.
- Las operaciones sensibles deberán protegerse frente a concurrencia: asignación doble de puestos o juegos, saldos incorrectos, papeletas duplicadas y sorteos repetidos.
- Las reglas de negocio se aplicarán en el backend.
- La primera versión mantendrá el alcance controlado: un premio y un ganador.
- Primero se desarrollará y probará la aplicación local; después se abordará la infraestructura cloud.

## Estructura actual

Estructura parcial del backend tras la primera implementación:

~~~text
app-torneo/
├── backend/
│   ├── src/
│   │   ├── eventos/
│   │   │   ├── dominio/
│   │   │   │   ├── estado-evento.enum.ts
│   │   │   │   └── evento.interface.ts
│   │   │   ├── dto/
│   │   │   │   └── crear-evento.dto.ts
│   │   │   └── eventos.module.ts
│   │   ├── salud/
│   │   │   ├── salud.module.ts
│   │   │   ├── salud.controller.ts
│   │   │   └── salud.service.ts
│   │   ├── app.module.ts
│   │   ├── app.controller.ts
│   │   ├── app.service.ts
│   │   └── main.ts
│   ├── test/
│   ├── package.json
│   └── README.md
└── README.md
~~~

La estructura se ampliará cuando se implementen nuevos módulos. Este árbol describe los archivos observados, no todos los que existirán al finalizar.

## Estado de implementación

### Backend
- [x] Proyecto NestJS inicializado.
- [x] Endpoint de salud GET /salud.
- [x] ValidationPipe global con whitelist, forbidNonWhitelisted y transform.
- [x] Enum inicial de estados del evento.
- [x] Interfaz inicial Evento.
- [x] DTO inicial CrearEventoDto.
- [x] Servicio y controlador inicial de eventos.
- [x] Pruebas unitarias y HTTP iniciales escritas (pendiente ejecutar y validar).
- [x] Configuración inicial de PostgreSQL y TypeORM.\n- [x] Migración inicial de la tabla eventos.\n- [ ] Regenerar package-lock.json y validar build/pruebas en CI.
- [ ] Participantes, retos, partidas, economía y sorteo.\n- [ ] Automatizar transiciones temporales de fase y proteger operaciones con autenticación.
- [ ] Autenticación y autorización.
- [ ] Comunicación en tiempo real.

### Aplicación móvil e infraestructura
- [ ] Aplicación Expo.
- [ ] Integración móvil con la API.
- [ ] Pruebas de integración.
- [ ] Infraestructura AWS.
- [ ] Despliegue automatizado y observabilidad.

Las tareas solo se marcarán como terminadas cuando exista implementación comprobada.

## Puesta en marcha

Desde la carpeta backend:

~~~bash
cd backend
npm install
npm run start:dev
~~~

NestJS escucha por defecto en el puerto 3000, o en el definido por la variable PORT.

Comprobación del endpoint:

~~~http
GET http://localhost:3000/salud
~~~

Comandos disponibles en backend/package.json:

~~~bash
npm run build
npm run start
npm run start:dev
npm run test
npm run test:e2e
npm run test:cov
npm run lint
~~~

> **Incidencia detectada en la revisión:** CrearEventoDto importa decoradores de class-validator, pero backend/package.json todavía no declara class-validator ni class-transformer. Hay que corregir y verificar las dependencias antes de considerar reproducible una instalación limpia.

## Documentación y ruta de estudio

- [Requisitos funcionales](docs/REQUISITOS-FUNCIONALES.md)\n- [API del backend](docs/API-BACKEND.md)\n- [Base de datos](docs/BASE-DE-DATOS.md)\n- [API del backend](docs/API-BACKEND.md)\n- [Base de datos](docs/BASE-DE-DATOS.md)
- [Arquitectura y decisiones técnicas](docs/ARQUITECTURA.md)
- [Documentación específica del backend](backend/README.md)

La documentación ampliada se organizará en docs/ y se actualizará junto con el código:

| Documento | Contenido |
|---|---|
| Requisitos funcionales | Reglas detalladas, actores, casos límite y criterios de aceptación. |
| Arquitectura | Capas, módulos, responsabilidades y decisiones técnicas. |
| Modelo de datos | Entidades, relaciones, restricciones e índices PostgreSQL. |
| API | Endpoints, DTO, ejemplos de petición/respuesta y errores. |
| Aplicación móvil | Navegación, pantallas, componentes y comunicación con la API. |
| AWS y despliegue | Infraestructura, seguridad, configuración, costes y operaciones. |
| Pruebas | Estrategia, escenarios y ejecución de pruebas. |

Orden recomendado para estudiar el proyecto:

1. TypeScript y fundamentos de Node.js.
2. NestJS: módulos, controladores, servicios e inyección de dependencias.
3. API REST, DTO y validación.
4. Diseño de dominio y reglas de negocio.
5. PostgreSQL, SQL, TypeORM y migraciones.
6. Transacciones, bloqueos y concurrencia.
7. Autenticación y autorización.
8. Comunicación en tiempo real.
9. Expo / React Native y consumo de API.
10. Integración y pruebas end-to-end.
11. AWS Serverless, redes y seguridad.
12. Terraform, CI/CD, observabilidad y mantenimiento.

La documentación de cada módulo explicará su propósito, responsabilidades, flujo de ejecución, decisiones relevantes y pruebas asociadas.

## Git

- Rama de integración: develop.
- Rama de producción: main; no se trabaja directamente sobre ella.
- Commits pequeños y descriptivos en español.
- Las funcionalidades se integrarán en develop tras revisar compilación y pruebas.
- Se crearán ramas de funcionalidad cuando el alcance lo justifique.
- No se desplegará ni modificará infraestructura de producción sin autorización expresa.

---

Proyecto personal de desarrollo y aprendizaje. La documentación debe reflejar siempre el estado real del repositorio.
