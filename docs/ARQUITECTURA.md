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

Se necesita comunicar cambios de retos, partidas y el resultado del sorteo a los clientes conectados. La tecnología y el mecanismo de autorización de conexiones se concretarán antes de implementar esta capacidad.

## 7. Arquitectura de despliegue objetivo

Se estudiará una solución AWS con:

- API Gateway como entrada HTTP.
- AWS Lambda para ejecutar el backend.
- RDS PostgreSQL como base de datos.
- RDS Proxy para gestionar conexiones desde entornos serverless.
- VPC y grupos de seguridad para aislar la base de datos.
- IAM con mínimo privilegio.
- Secrets Manager para credenciales y secretos.
- Terraform para infraestructura como código.

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
