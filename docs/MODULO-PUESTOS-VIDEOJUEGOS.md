# Módulos de puestos y videojuegos

## Catálogo de videojuegos

El videojuego es un recurso lógico independiente del puesto físico. El catálogo guarda nombre, plataforma y estado activo.

## Puestos

Cada puesto pertenece a una edición y tiene un código único dentro de esa edición. La relación muchos-a-muchos con videojuegos indica qué títulos son compatibles con ese puesto.

## Regla de disponibilidad

La compatibilidad no equivale a disponibilidad. Que un juego sea compatible con varios puestos no permite usarlo en dos partidas simultáneas. La reserva exclusiva del videojuego se resolverá en el módulo de partidas mediante una transacción y una restricción de base de datos.

## Rutas

| Método | Ruta | Uso |
|---|---|---|
| POST | `/videojuegos` | Crear título |
| GET | `/videojuegos` | Consultar catálogo activo |
| POST | `/eventos/:eventoId/puestos` | Crear puesto y compatibilidades |
| GET | `/eventos/:eventoId/puestos` | Listar puestos activos |

## Configuración

Los puestos solo pueden crearse cuando la edición está en BORRADOR. La operación bloquea la fila de la edición para evitar que una configuración concurrente se cuele después de iniciar el torneo.

## Seguridad pendiente

Las rutas de escritura deben requerir rol de anfitrión de esa edición. Hasta que se complete autenticación y autorización, no se debe publicar esta API en Internet.
