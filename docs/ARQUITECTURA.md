# Arquitectura de APUCHITORNEO

## 1. Estado de este documento

Describe la arquitectura objetivo y distingue las decisiones acordadas de los componentes que todavía no se han implementado.

## 2. Visión general

La aplicación móvil Expo consume una API HTTP desarrollada con NestJS. El backend concentra las reglas de negocio y utiliza PostgreSQL como almacenamiento principal. Los eventos que deban reflejarse en tiempo real se publicarán mediante un mecanismo de comunicación en tiempo real que se definirá durante esa fase.

~~~text
Aplicación móvil (Expo / React Native)
                 |
                 | HTTPS / API REST
                 v
             Backend NestJS
       +---------+----------+
       |         |          |
   Eventos    Partidas   Economía
       |         |          |
       +---------+----------+
                 |
          PostgreSQL
                 |
       Notificaciones en tiempo real
~~~

## 3. Backend

NestJS organiza la aplicación en módulos. Como criterio general:

- **Módulo:** agrupa una capacidad funcional y declara sus dependencias.
- **Controlador:** recibe peticiones HTTP, valida el contexto de entrada y devuelve respuestas.
- **Servicio:** ejecuta casos de uso y coordina reglas de negocio.
- **DTO:** define y valida los datos que entran o salen de la API.
- **Dominio:** contiene conceptos y reglas propias del negocio, sin depender de detalles HTTP.

Los controladores no deben contener reglas complejas ni acceder directamente a la base de datos.

## 4. Persistencia

PostgreSQL es la base de datos principal acordada. TypeORM es el ORM previsto para mapear entidades y gestionar consultas y migraciones.

Las reglas de integridad no deben depender solo del código de aplicación: cuando sea posible, también se expresarán mediante claves foráneas, restricciones únicas, índices y transacciones.

## 5. Concurrencia

La asignación de jugadores, puestos y videojuegos es una operación crítica. Dos solicitudes concurrentes no pueden reservar el mismo recurso. La estrategia concreta (transacciones, bloqueos y restricciones) se definirá con el modelo relacional y se cubrirá con pruebas de concurrencia.

La economía también requiere operaciones atómicas: actualizar saldo y registrar el movimiento deben formar una única operación coherente. El sorteo debe ser idempotente para impedir múltiples ganadores por reintentos.

## 6. Tiempo real

El canal en tiempo real todavía no está implementado. Para la primera integración con Expo, se recomienda mantener HTTP como fuente de verdad y permitir actualización periódica mediante consultas, con `ETag` o cursores si el volumen lo requiere. Esto evita introducir conexiones persistentes en la API NestJS antes de tener definidos los eventos y permisos.

Cuando se necesiten notificaciones inmediatas, la opción alineada con el despliegue previsto es API Gateway WebSocket con funciones Lambda para conectar, desconectar y publicar, y un registro independiente de conexiones (por ejemplo, DynamoDB). Las notificaciones deben derivarse de cambios ya confirmados en PostgreSQL; una tabla outbox transaccional evitaría publicar un evento que luego se revierta. El cliente debe poder recuperar el estado por HTTP si pierde una notificación. No se recomienda incorporar Socket.IO al proceso HTTP de Lambda.

Referencias oficiales: [API Gateway WebSocket](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api-overview.html), [gestión de conexiones WebSocket](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-how-to-call-websocket-api-connections.html).

## 7. Arquitectura de despliegue objetivo

Se estudiará una solución AWS con:

- API Gateway como entrada HTTP.
- AWS Lambda para ejecutar el backend.
- RDS PostgreSQL como base de datos.
- RDS Proxy para gestionar conexiones desde entornos serverless.
- VPC y grupos de seguridad para aislar la base de datos.
- IAM con mínimo privilegio.
- Secrets Manager para credenciales y secretos.
- Terraform como opción de infraestructura como código en una fase posterior.

En Lambda, las conexiones breves y concurrentes a PostgreSQL deben evaluarse con RDS Proxy para amortiguar la creación de conexiones. La configuración actual crea una conexión TypeORM al iniciar NestJS y aún no implementa un adaptador de arranque/parada Lambda ni carga de secretos desde Secrets Manager; esos cambios pertenecen a la fase de despliegue. Referencia: [Lambda y RDS](https://docs.aws.amazon.com/lambda/latest/dg/services-rds.html).

No hay que interpretar esta lista como recursos ya creados. El despliegue se realizará después de probar la aplicación localmente y con autorización expresa.

## 8. Decisiones acordadas

| Decisión | Motivo |
|---|---|
| PostgreSQL | Fuente de datos relacional y transaccional para el dominio del torneo. |
| NestJS y TypeScript | Backend modular y tipado. |
| Expo / React Native | Aplicación móvil multiplataforma. |
| AWS Serverless en fase posterior | Desplegar cuando el sistema local esté probado. |
| Un premio y un ganador inicialmente | Mantener acotada la primera versión. |
| Reglas en backend | Evitar que clientes puedan saltarse validaciones. |

## 9. Evolución de la arquitectura

La arquitectura se actualizará cuando se decidan e implementen autenticación, modelo de datos, tiempo real, observabilidad y despliegue. Cada cambio relevante debe explicar qué problema resuelve y qué alternativas se descartaron.
