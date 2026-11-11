# Backend de APUCHITORNEO

API del sistema APUCHITORNEO desarrollada con **NestJS y TypeScript**.

Este backend centraliza las reglas de negocio del torneo. La aplicación móvil no debe decidir por sí sola si un reto, una partida, una recompensa o un sorteo son válidos: esas decisiones se comprueban en el servidor.

## Estado actual

- NestJS inicializado.
- Endpoint de comprobación de salud: `GET /salud`.
- `ValidationPipe` global configurado.
- Primeros contratos del dominio de eventos: enum, interfaz y DTO.
- El módulo de eventos todavía necesita su servicio, controlador, pruebas y persistencia.
- PostgreSQL y TypeORM están planificados, no configurados todavía.

## Requisitos

- Node.js compatible con las versiones declaradas en el proyecto.
- npm.

## Instalación y ejecución

Desde esta carpeta:

~~~bash
npm install
npm run start:dev
~~~

La API escucha por defecto en el puerto `3000`. Se puede cambiar mediante la variable de entorno `PORT`.

Comprobar el estado:

~~~http
GET http://localhost:3000/salud
~~~

## Scripts

| Comando | Propósito |
|---|---|
| `npm run start` | Inicia NestJS. |
| `npm run start:dev` | Inicia en modo desarrollo con recarga. |
| `npm run build` | Compila TypeScript. |
| `npm run start:prod` | Ejecuta el resultado compilado. |
| `npm run test` | Ejecuta pruebas unitarias. |
| `npm run test:e2e` | Ejecuta pruebas end-to-end. |
| `npm run test:cov` | Genera cobertura de pruebas. |
| `npm run lint` | Ejecuta el análisis estático configurado. |

## Organización del código

- `main.ts`: crea la aplicación NestJS, configura validación global e inicia el servidor.
- `app.module.ts`: módulo raíz que importa los módulos funcionales.
- `salud/`: endpoint sencillo para comprobar que el proceso responde.
- `eventos/`: dominio inicial para representar una edición del torneo.

Dentro de cada módulo se separarán controlador, servicio, DTO y dominio. El controlador se ocupará del protocolo HTTP; el servicio coordinará los casos de uso; el dominio expresará las reglas del torneo.

## Validación de entrada

El `ValidationPipe` global utiliza:

- `whitelist: true`: elimina propiedades que no estén declaradas en el DTO.
- `forbidNonWhitelisted: true`: rechaza peticiones con propiedades no permitidas.
- `transform: true`: permite transformar los datos de entrada a los tipos definidos cuando corresponda.

Los DTO utilizan decoradores de validación. **Incidencia pendiente detectada:** el DTO de creación de eventos importa `class-validator`, pero las dependencias declaradas actualmente no incluyen `class-validator` ni `class-transformer`. Hay que añadirlas y sincronizar el lockfile antes de validar una instalación limpia.

## Documentación relacionada

- [Requisitos funcionales](../docs/REQUISITOS-FUNCIONALES.md)
- [Arquitectura y decisiones técnicas](../docs/ARQUITECTURA.md)
- [README general](../README.md)

## Criterios de calidad

Antes de considerar terminado un módulo:

1. Debe respetar los requisitos funcionales.
2. Debe validar entradas y estados no permitidos.
3. Debe tener pruebas unitarias de sus reglas.
4. Debe tener pruebas HTTP de los endpoints relevantes.
5. Debe documentar responsabilidades, respuestas y errores.
6. No debe depender de datos en memoria cuando se haya incorporado la persistencia definitiva.
