# ADR-007: Precios de juegos por tamaño y precio cobrado guardado en la orden

- **Estado:** Propuesto
- **Fecha:** 2026-11-25
- **Issue:** #10

## Contexto

- Respuesta de Marcelo del 25/11/2026 (P-04, RN-04, RF-57): el precio del préstamo de un juego **depende de su tamaño**. En el local, cada juego tiene una **etiqueta de color** que representa su precio. El administrador tiene que poder definir los tamaños (por ejemplo chico, mediano, grande), cada uno con su precio y su color. Al cambiar el precio de un tamaño, cambia el de todos sus juegos **para las órdenes nuevas**.
- **Hoy** cada juego tiene su propio precio: la columna `juego.precio` (numeric, NOT NULL). Se usa en:
  - el cálculo del total de la orden (`utils/orderUtils.actualizarTotalOrden`) y en `ordenService` (código muerto en `removerDescuento`);
  - los ingresos por juegos del dashboard (`reportesController`);
  - el listado de juegos de una orden (`contenedorJuegoService`) y la vista de la orden en el POS (`productos.js`);
  - el formulario del admin (`adminProductos.js`), la validación de `juegoController` y la importación por Excel (`importacionService`).
- El ítem de la orden (`contenedor_juego`) **no guarda el precio cobrado**: el total se recalcula siempre con el precio actual. Por eso borrar un juego o cambiarle el precio cambia el total de las órdenes abiertas y los reportes históricos (#22).
- Ya hay datos cargados con precios por juego, y no se pueden perder.

## Opciones consideradas

**Cómo modelar el precio:**

1. **Tabla de tamaños** (`tamano_juego`: nombre, precio, color, activo) y cada juego apunta a su tamaño (`juego.tamano_id`). El precio sale del tamaño.
   - A favor: refleja la regla del negocio (RN-04); cambiar un precio es una sola edición; el color de la etiqueta queda en el sistema.
   - En contra: hay que migrar los datos actuales y tocar todos los usos de `juego.precio`.
2. **Tamaños con precio, más un precio propio opcional por juego** que reemplaza al del tamaño.
   - A favor: permite excepciones.
   - En contra: rompe la regla "el color de la etiqueta dice el precio"; la persona en el local ya no sabe qué cobrar mirando la etiqueta. ⚠ Solo tendría sentido si el dueño confirma que hay excepciones.
3. **Dejar el precio en cada juego** y agregar un campo "tamaño" solo informativo.
   - A favor: casi no cambia nada.
   - En contra: no cumple RF-57: cambiar el precio de un tamaño obliga a editar juego por juego.

**Cómo pasar los precios actuales a tamaños:**

- **A. Automático:** la migración crea **un tamaño por cada precio distinto** que existe hoy (por ejemplo "Tamaño 15 Bs") y asigna cada juego al suyo. Después, el admin les pone nombre y color.
- **B. Manual:** el admin define los tamaños y asigna cada juego antes de migrar (con una planilla).

**Cómo guardar el precio cobrado:**

- **Guardar el precio unitario en el ítem** (`contenedor_juego.precio_unitario`) en el momento de agregar el juego a la orden (lo mismo para productos, #22).
- O **recalcular siempre** con el precio actual, como hoy (es la causa de #22).

## Decisión

- **Modelo: opción 1, tabla de tamaños.** Cada juego tiene un tamaño y el precio sale del tamaño. Se crea `tamano_juego` (`id`, `nombre`, `precio` numeric(10,2) mayor o igual a 0, `color` en hexadecimal, `activo`, marcas de tiempo) y `juego.tamano_id` (clave foránea).
- **Migración de datos: A, automática**, porque no pierde ningún precio y no bloquea el trabajo. El admin después renombra los tamaños y les asigna su color.
- **Precio cobrado: se guarda en el ítem.** `contenedor_juego.precio_unitario` se llena al agregar el juego, con el precio del tamaño en ese momento. El total y los reportes usan ese valor. Así, cambiar el precio de un tamaño solo afecta a las órdenes nuevas (RF-57) y los reportes muestran lo que realmente se cobró.
- **La migración se hace en pasos** (patrón *expand / contract*), cada uno reversible y con sus pruebas:
  1. Crear `tamano_juego` y `juego.tamano_id` (todavía opcional), sin quitar `juego.precio`.
  2. Migración de datos: un tamaño por precio distinto; asignar cada juego. Los ítems existentes reciben `precio_unitario` = precio actual del juego (es el mejor dato disponible; el historial anterior ya se calculaba así).
  3. El código lee el precio del tamaño y escribe `precio_unitario`; se actualizan el formulario del admin, la importación (columna `tamano` en lugar de `precio`) y los reportes.
  4. Cuando todo funciona y se verificó con datos reales, `juego.tamano_id` pasa a obligatorio y se elimina `juego.precio` en una migración aparte.
- **No se elige la opción 2** (precio propio por juego) mientras el dueño no confirme que hay excepciones. ⚠ Pregunta para el 10/12 (**P-23**): ¿algún juego tiene un precio distinto al de su etiqueta de color?

## Consecuencias

- **Positivas:**
  - El sistema sigue la misma regla que el local: el color de la etiqueta dice el precio.
  - Cambiar un precio es una sola edición, y no altera órdenes abiertas ni reportes pasados.
  - Corrige de raíz el problema de los totales que cambian solos (#22) también para los juegos.
  - Prepara la lectura de códigos (RF-39, #59): al leer un juego, el precio sale de su tamaño.
- **Negativas o riesgos:**
  - Hay que tocar varios lugares (total, reportes, formulario, importación, POS, catálogo); si se olvida uno, mostraría un precio que no se cobra. Las pruebas de la Etapa 3 y una búsqueda de `juego.precio` antes del paso 4 lo cubren.
  - Los tamaños creados automáticamente tienen nombres genéricos hasta que el admin los edite.
  - Durante los pasos 1 a 3 conviven `juego.precio` y el precio del tamaño; el código tiene que usar una sola fuente desde el paso 3.
- **Qué hay que hacer ahora:**
  - Primero #22 (guardar `precio_unitario` en los ítems de productos y juegos).
  - Después #37 (tamaños), siguiendo los pasos de arriba.
  - Preguntar **P-23** el 10/12 (excepciones de precio).

**Relacionado:** RF-37, RF-38, RF-57, RN-04 · #22 · #31 · #37 · #59
