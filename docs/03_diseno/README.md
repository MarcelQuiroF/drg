# 03 · Diseño

Cómo está construido el sistema y por qué.

| Documento | Contenido |
|-----------|-----------|
| [`endpoints.md`](endpoints.md) | Referencia de la API REST (`/api/v1`) |
| [`arquitectura.md`](arquitectura.md) | Capas, componentes y cómo se comunican *(por completar)* |
| [`modelo-datos.md`](modelo-datos.md) | Tablas, relaciones y diagrama entidad-relación *(por completar)* |
| [`adr/`](adr/README.md) | Registro de decisiones de arquitectura (ADR), con su índice |

Más adelante también va aquí la referencia de la app Android anterior (capturas y recorrido de pantallas), en `referencia-app-android/`.

## ADR (Architecture Decision Record)

Un ADR es un documento corto que registra **una** decisión técnica importante: el contexto, las opciones que se evaluaron, lo que se decidió y sus consecuencias. Sirve para que, meses después, se entienda por qué el sistema es como es.

- Se numeran en orden: `001-migracion-typescript.md`, `002-…`.
- Se copian de [`adr/000-plantilla.md`](adr/000-plantilla.md).
- Un ADR aceptado no se edita para cambiar la decisión: se escribe uno nuevo que lo reemplaza y se marca el viejo como *Reemplazado por ADR-00x*.
