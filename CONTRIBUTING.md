# Cómo contribuir a DRG – Mesa Dragón

Este documento reúne las convenciones del proyecto. Vale para cualquier persona (o asistente) que trabaje en el repositorio.

## 1. Flujo de trabajo

Todo cambio sigue el mismo camino:

```
issue → rama → commits → pull request → revisión → merge a main
```

1. **Issue primero.** Si no hay issue, se crea con una de las plantillas (bug, tarea o historia de usuario).
2. **Una rama por issue**, que sale siempre de `main` actualizado.
3. **Commits pequeños** con el formato de la sección 3.
4. **Pull request** con la plantilla del repo. La descripción incluye `Closes #n` para que la issue se cierre sola al hacer merge.
5. **Nunca se hace push directo a `main`.** El merge lo hace el responsable del repo después de revisar el PR.
6. Se usa **squash merge** si el PR tiene commits de trabajo ("wip", correcciones menores). Si cada commit cuenta algo por sí solo, se usa merge normal.

## 2. Ramas

Formato: `tipo/numero-descripcion-corta`

| Parte | Regla | Ejemplo |
|-------|-------|---------|
| `tipo` | Uno de los tipos de commit (sección 3) | `fix`, `feat`, `docs` |
| `numero` | Número de la issue, sin `#` | `12` |
| `descripcion-corta` | Minúsculas, guiones, sin tildes, sin ñ, sin espacios. De 2 a 5 palabras | `pagos-qr` |

Ejemplos: `fix/12-pagos-qr`, `feat/30-cierre-de-caja`, `docs/4-adr-typescript`, `chore/1-plantillas-repo`.

- Todo en **minúsculas**. En Windows, `Fix/` y `fix/` chocan y rompen el `git fetch`.
- Si el trabajo no tiene issue (algo excepcional), se crea la issue antes de abrir la rama.

## 3. Mensajes de commit

Se usa **[Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/)** en español.

```
tipo(ámbito): descripción en imperativo y en minúscula (#n)

Cuerpo opcional: qué cambia y por qué (no cómo). Líneas de hasta 72 caracteres.

Closes #n
```

### Tipos

| Tipo | Cuándo |
|------|--------|
| `feat` | Funcionalidad nueva para el usuario |
| `fix` | Corrección de un error |
| `docs` | Solo documentación |
| `refactor` | Cambio de código que no altera el comportamiento |
| `test` | Agregar o corregir pruebas |
| `chore` | Mantenimiento: dependencias, configuración, scripts, limpieza |
| `style` | Formato (espacios, comas, etc.), sin cambio de lógica |
| `perf` | Mejora de rendimiento |

### Ámbitos

`backend`, `frontend`, `db` (migraciones, modelos, seeders), `auth`, `ordenes`, `pagos`, `comandas`, `reservas`, `mesas`, `asistencia`, `empleados`, `productos`, `juegos`, `reportes`, `importacion`, `config`, `ci`, `repo`, `mobile`.

Si el cambio toca varios módulos, se usa el más general (`backend` o `frontend`) o se omite el ámbito.

### Reglas

- Descripción en **imperativo** ("registrar", no "registrado" ni "registra"), en minúscula y sin punto final. Hasta unos 70 caracteres.
- El número de la issue va entre paréntesis al final de la línea: `(#12)`.
- Un cambio que rompe compatibilidad (por ejemplo, cambia la forma de una respuesta de la API) lleva `!` después del tipo y una línea `BREAKING CHANGE:` en el cuerpo.

### Ejemplos

```
fix(ordenes): registrar pagos QR al finalizar orden (#12)
fix(db): reajustar secuencias después del seeder (#7)
feat(reportes): guardar el cierre de caja en el backend (#30)
docs: agregar ADR de migración a TypeScript (#4)
chore(repo): agregar plantillas de issues y PR (#1)
refactor(ordenes)!: unificar respuestas de la API en { message, data } (#41)
```

## 4. Issues

Hay tres plantillas en `.github/ISSUE_TEMPLATE/`:

| Plantilla | Título | Cuándo |
|-----------|--------|--------|
| Bug | `[BUG] Descripción corta del fallo` | Algo no funciona como debería |
| Tarea | `[TAREA] Qué hay que hacer` | Trabajo técnico, de documentación o de infraestructura |
| Historia de usuario | `[HU] Nombre de la funcionalidad` | Funcionalidad nueva pensada desde el usuario (mesero, cajero, admin) |

- Los **criterios de aceptación** deben ser verificables: se puede responder sí o no. Nada de "funciona bien".
- Cada issue lleva **un tipo** (`bug`, `tarea`, `historia-usuario`), **una prioridad** (`prioridad:alta/media/baja`), **la zona** (`backend`, `frontend`, `db`…) y su **milestone** (la etapa de la ruta de trabajo).
- Las issues que se descartan se cierran con la etiqueta `no-se-hara` y un comentario con el motivo. Las que se dejan para después llevan `futuro`.

### Etiquetas

| Grupo | Etiquetas |
|-------|-----------|
| Tipo | `bug`, `tarea`, `historia-usuario`, `mejora`, `docs`, `seguridad`, `deuda-tecnica`, `pruebas` |
| Prioridad | `prioridad:alta`, `prioridad:media`, `prioridad:baja` |
| Zona | `backend`, `frontend`, `db`, `mobile` |
| Estado | `bloqueado`, `futuro`, `no-se-hara` |

Las etiquetas y los milestones se crean con `.github/scripts/configurar-repo.sh` (ver el propio script).

## 5. Pull requests

- El título sigue el mismo formato que un commit: `fix(ordenes): registrar pagos QR al finalizar orden (#12)`.
- Se completa la plantilla: qué cambia, por qué, cómo se probó y la lista de verificación.
- Un PR resuelve **una sola issue**. Si aparece otro problema en el camino, se anota como issue nueva.
- Los documentos nuevos van en la carpeta de su disciplina dentro de `docs/` (índice en `docs/README.md`).
- Si el PR cambia la API, se actualiza `docs/03_diseno/endpoints.md` en el mismo PR.
- Si el PR toma una decisión de arquitectura, se agrega o actualiza un ADR en `docs/03_diseno/adr/` (plantilla: `000-plantilla.md`).

## 6. Estilo de código

Hasta que lleguen ESLint y Prettier (Etapa 3 de la ruta), se mantiene el estilo actual:

- **Indentación de 4 espacios**, UTF-8 y finales de línea LF (ver `.editorconfig`).
- Punto y coma al final de cada sentencia.
- **Backend:** CommonJS (`require` / `module.exports`), patrón **Route → Controller → Service → Model**. Los controladores no hablan directo con los modelos: pasan por el servicio.
- **Frontend:** módulos ES6 (`import` / `export`) en `frontend/js/modules/`.
- Nombres de variables, funciones, rutas y mensajes en **español**, en `camelCase` (`crearOrden`, `actualizarTotalOrden`). Las tablas y columnas de la base de datos en `snake_case` (`mesa_id`, `hora_entrada`).
- Los errores del backend se pasan a `next(error)` para que los maneje `errorHandler`.
- Nada de credenciales, `.env` ni datos reales de clientes o empleados en el repositorio.

## 7. Definición de "terminado"

Un PR está listo para merge cuando:

- [ ] Cumple todos los criterios de aceptación de la issue.
- [ ] Se probó de forma manual (y, cuando existan, pasan las pruebas automáticas y el CI).
- [ ] La documentación afectada está actualizada (`README.md`, `docs/`).
- [ ] No deja código comentado, `console.log` de depuración ni archivos sueltos.
