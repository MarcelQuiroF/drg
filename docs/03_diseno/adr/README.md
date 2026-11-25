# Registro de decisiones de arquitectura (ADR)

Qué es un ADR y cómo se escribe: ver [`../README.md`](../README.md#adr-architecture-decision-record). Plantilla: [`000-plantilla.md`](000-plantilla.md).

| ADR | Decisión | Estado |
|-----|----------|--------|
| [001](001-migracion-typescript.md) | Migración gradual del backend a TypeScript | Aceptado |
| [002](002-frontend-vanilla-vite.md) | Frontend en JavaScript vanilla con Vite, sin framework | Aceptado |
| [003](003-despliegue-local.md) | Despliegue en la PC local del café con Docker Compose | Aceptado |
| [004](004-respaldos.md) | Respaldos con `pg_dump` diario y copia fuera de la PC | Aceptado |
| [005](005-cliente-movil.md) | Cliente móvil para meseros con React Native + Expo | Aceptado |
| [006](006-impresion-comandas.md) | Impresión de comandas desde el servidor local | Aceptado |
| [007](007-precios-juegos-por-tamano.md) | Precios de juegos por tamaño y precio cobrado en la orden | Aceptado |
| [008](008-rbac-permisos-por-accion.md) | Control de acceso por roles con permisos por acción (RBAC) | Aceptado |

Los ADR 001 a 008 se escribieron en la issue #10, uno por PR, y Marcelo los aprobó el 25/11/2026 (#91). Un ADR nuevo entra como **Propuesto**. Cuando Marcelo lo aprueba en la revisión del PR, el estado se cambia a **Aceptado** (en el ADR y en esta tabla) antes del merge.

Si una decisión cambia, no se edita el ADR aceptado: se escribe uno nuevo y el viejo pasa a **Reemplazado por ADR-00x**.
