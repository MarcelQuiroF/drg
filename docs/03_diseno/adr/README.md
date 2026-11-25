# Registro de decisiones de arquitectura (ADR)

Qué es un ADR y cómo se escribe: ver [`../README.md`](../README.md#adr-architecture-decision-record). Plantilla: [`000-plantilla.md`](000-plantilla.md).

| ADR | Decisión | Estado |
|-----|----------|--------|
| [001](001-migracion-typescript.md) | Migración gradual del backend a TypeScript | Propuesto (PR #77) |
| [002](002-frontend-vanilla-vite.md) | Frontend en JavaScript vanilla con Vite, sin framework | Propuesto (PR #79) |
| [003](003-despliegue-local.md) | Despliegue en la PC local del café con Docker Compose | Propuesto (PR #80) |
| [004](004-respaldos.md) | Respaldos con `pg_dump` diario y copia fuera de la PC | Propuesto (PR #81) |
| [005](005-cliente-movil.md) | Cliente móvil para meseros (React Native + Expo, propuesto) | Propuesto (PR #82) |
| [006](006-impresion-comandas.md) | Impresión de comandas desde el servidor local | Propuesto (PR #83) |
| [007](007-precios-juegos-por-tamano.md) | Precios de juegos por tamaño y precio cobrado en la orden | Propuesto (PR #84) |
| [008](008-rbac-permisos-por-accion.md) | Control de acceso por roles con permisos por acción (RBAC) | Propuesto (PR #88) |

Los ADR se escriben en la issue #10, uno por PR. Los enlaces a los ADR 002 a 008 funcionan cuando se mergea cada PR; la columna *Estado* se actualiza al aceptarlos. Un ADR entra como **Propuesto**. Cuando Marcelo lo aprueba en la revisión del PR, el estado se cambia a **Aceptado** (en el ADR y en esta tabla) antes del merge.
