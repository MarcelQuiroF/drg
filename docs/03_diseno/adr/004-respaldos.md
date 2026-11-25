# ADR-004: Respaldos de la base de datos con `pg_dump` diario y copia fuera de la PC

- **Estado:** Propuesto
- **Fecha:** 2026-11-25
- **Issue:** #10

## Contexto

- Toda la información del negocio (órdenes, pagos, reservas, asistencia, catálogo) va a estar en **una sola base PostgreSQL en una PC del local** (ADR-003). Si el disco falla, la PC se daña o alguien borra algo por error, sin respaldo se pierde todo.
- RF-54: la base se respalda **de forma automática**; el administrador ve **la fecha del último respaldo** y puede lanzar uno **a mano**.
- RNF-07: un respaldo se puede **restaurar**, y la restauración se prueba al menos una vez antes de la entrega.
- **P-14 (pendiente):** dónde guardar las copias y quién las revisa. La propuesta que se le va a hacer al dueño es "respaldo automático diario en la PC y una copia semanal en Drive".
- El volumen de datos es chico: un café con decenas de órdenes por día. Un respaldo completo debería pesar pocos megas durante años.
- La base tiene **datos personales**: nombres, CI y teléfonos de clientes y empleados, y las contraseñas con hash.
- El cierre del día va a existir en el servidor (#34): es un buen momento para respaldar, porque el día ya está completo.

## Opciones consideradas

1. **`pg_dump` programado** (respaldo lógico de toda la base en un archivo).
   - A favor: simple; un solo archivo por respaldo; se restaura con `pg_restore` en cualquier PostgreSQL de la misma versión o una más nueva; con este volumen de datos tarda segundos.
   - En contra: se pierde lo que pasó entre el último respaldo y la falla (hasta un día de trabajo si es diario).
2. **Archivado continuo de WAL** (recuperación a un momento exacto, *point-in-time recovery*).
   - A favor: casi no se pierde nada; se puede volver a cualquier minuto.
   - En contra: mucho más complejo de configurar, vigilar y restaurar; exagerado para este tamaño de negocio y para alguien que lo mantiene solo.
3. **Copiar la carpeta de datos o el volumen de Docker.**
   - A favor: rápido.
   - En contra: si se copia con la base encendida, la copia puede quedar inconsistente; solo sirve con la misma versión exacta de PostgreSQL.
4. **Base administrada en la nube**, con respaldos incluidos.
   - A favor: los respaldos los hace el proveedor.
   - En contra: depende de pasar a la nube (Etapa 9).

## Decisión

Se elige la **opción 1: `pg_dump` en formato custom (`-Fc`)**, con una **copia fuera de la PC**.

- **Cuándo se respalda:**
  - Automáticamente **al cerrar el día** (#34), y además todos los días a una hora fija de la madrugada por si nadie cerró el día.
  - **A mano** desde el panel de administración (RF-54).
  - **Antes de cada actualización** del sistema o de correr migraciones nuevas.
- **Dónde se guarda:**
  - En la PC del local, en una carpeta **fuera** del volumen de la base (si se pierde el volumen, no se pierden los respaldos).
  - **Una copia fuera de la PC** al menos una vez por semana. ⚠ El lugar lo decide el dueño (P-14): la propuesta es Google Drive; la alternativa es un disco externo o un USB.
- **Cuántos se guardan** (valor de prueba, ⚠ P-14): los últimos 14 diarios y uno por mes de los últimos 12 meses. Con el tamaño esperado ocupa muy poco espacio.
- **Seguridad:** la copia que sale de la PC va **cifrada** (por ejemplo, un archivo comprimido con contraseña o `gpg`), porque tiene datos personales. La contraseña del cifrado la guarda el dueño, no queda en el repo.
- **Vigilancia:** el panel de administración muestra la fecha y el tamaño del último respaldo, y un **aviso** si el último tiene más de un día.
- **Restauración:** un script y una guía en `docs/04_implementacion/` para restaurar en una base nueva. Se prueba antes de la entrega (RNF-07) y después cada tanto (⚠ cada cuánto, a definir).
- **Qué se acepta perder:** como máximo, lo trabajado desde el último respaldo (normalmente, el día en curso). Para un café es razonable: lo del día se puede reconstruir con los comprobantes de QR y la caja. Si el dueño necesita perder menos, se reconsidera la opción 2.

## Consecuencias

- **Positivas:**
  - Respaldos simples de entender y de restaurar, con un solo comando.
  - Funciona igual con Docker (comando dentro del contenedor de la base) o con una instalación nativa (ADR-003).
  - Se puede ver desde el sistema si los respaldos están al día.
- **Negativas o riesgos:**
  - La copia fuera de la PC necesita internet (si es Drive) o que alguien conecte el USB: si nadie lo hace, solo quedan los respaldos dentro de la PC.
  - Si se pierde la contraseña del cifrado, la copia externa no sirve.
  - Entre respaldos se puede perder hasta un día de trabajo.
- **Qué hay que hacer ahora:**
  - Preguntar P-14 el 10/12 (dónde, quién revisa, cuántos guardar).
  - Etapa 7: implementar #75 (script de respaldo, tarea programada, vista en el panel, copia externa cifrada y prueba de restauración documentada).
  - Coordinar con #34: el cierre del día dispara el respaldo.

**Relacionado:** RF-54, RNF-07 · ADR-003 · #34 · #75
