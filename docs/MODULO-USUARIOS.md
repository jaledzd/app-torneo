# Módulo de usuarios

## Responsabilidad

Gestiona las cuentas globales de APUCHITORNEO. La participación en una edición concreta se modelará por separado: una misma cuenta podrá inscribirse en distintas ediciones.

## Archivos

- `dominio/rol-usuario.enum.ts`: roles PARTICIPANTE, ANFITRION y ADMINISTRADOR.
- `dominio/usuario.entity.ts`: entidad persistida.
- `dto/crear-usuario.dto.ts`: validación de los datos de registro.
- `usuarios.service.ts`: registro y consultas.
- `usuarios.controller.ts`: rutas HTTP.
- `usuarios.module.ts`: composición del módulo.
- `database/migrations/1760000001000-CrearTablaUsuarios.ts`: creación de tabla y restricciones.

## Registro

`POST /usuarios/registro`

El registro público asigna siempre el rol PARTICIPANTE. No se acepta el rol desde el cuerpo de la petición, para evitar que una persona se otorgue permisos de anfitrión o administración.

El correo se normaliza a minúsculas y se protege con una restricción única en PostgreSQL. La contraseña se deriva con scrypt y una sal aleatoria; el campo secreto está excluido de las consultas ordinarias.

## Rutas disponibles

| Método | Ruta | Uso |
|---|---|---|
| POST | `/usuarios/registro` | Crear cuenta |
| GET | `/usuarios` | Listar cuentas |
| GET | `/usuarios/:id` | Consultar cuenta |

## Pendiente de integración

Las rutas de consulta y las operaciones de administración deberán protegerse mediante autenticación y autorización por roles antes de exponer el backend públicamente. El módulo de autenticación incorporará inicio de sesión, emisión y validación de credenciales.
