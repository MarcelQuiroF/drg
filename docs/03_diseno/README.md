# 03 · Diseño

Cómo está construido el sistema y por qué.

| Documento | Contenido |
|-----------|-----------|
| [`endpoints.md`](endpoints.md) | Referencia de la API REST (`/api/v1`) |
| [`permisos.md`](permisos.md) | Permisos por acción, qué tiene cada rol (ADMIN, CAJERO, MESERO) y qué permiso pide cada endpoint (RF-52, ADR-008) |
| [`arquitectura.md`](arquitectura.md) | Capas, componentes y cómo se comunican |
| [`modelo-datos.md`](modelo-datos.md) | Tablas, relaciones y diagrama entidad-relación |
| [`adr/`](adr/) | Registro de decisiones de arquitectura (ADR) |

## ADR (Architecture Decision Record)

Un ADR es un documento corto que registra **una** decisión técnica importante: el contexto, las opciones que se evaluaron, lo que se decidió y sus consecuencias. Sirve para que, meses después, se entienda por qué el sistema es como es.

- Se numeran en orden: `001-migracion-typescript.md`, `002-…`.
- Se copian de [`adr/000-plantilla.md`](adr/000-plantilla.md).
- Un ADR aceptado no se edita para cambiar la decisión: se escribe uno nuevo que lo reemplaza y se marca el viejo como *Reemplazado por ADR-00x*.
