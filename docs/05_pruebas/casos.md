# Casos de prueba

> Versión 0.5 · 25/11/2026 · Issue #18. Cómo se escriben y por qué: [`plan-de-pruebas.md`](plan-de-pruebas.md).
> Los códigos (S1, T6, F2…) vienen del análisis técnico del 12/11/2026 (secciones 10 a 12). Cada prueba automática lleva su código en el nombre.

## Categorías

| | Categoría | Cómo se prueba |
|:-:|-----------|----------------|
| ✅ | **Pasa hoy** | `test` normal: fija el comportamiento correcto para que no se rompa |
| 🐞 | **Bug abierto** | `test.failing` con el resultado correcto y el número de la issue. Pasa a `test` en el PR que corrige el bug |
| 🔄 | **Ya no aplica** por una regla nueva (RN-06, RN-16) | `test` del comportamiento que pide la regla nueva |
| 🖥 | **Solo del navegador** | Prueba manual (o E2E más adelante). La parte de la API, si la hay, se automatiza aparte |
| ⏳ | **Regla o funcionalidad por definir** | Sin prueba automática por ahora: se escribe en la issue que la implementa, cuando la regla esté clara (⚠ en los requisitos). Así no se inventan reglas del negocio |

**Estado:** ✔ automatizado · 🔜 se automatiza en el PR del módulo · 📋 queda como prueba manual · — sin prueba por ahora.

## Infraestructura y seed

| Código | Caso | Cat. | Resultado esperado | Issue | Estado |
|--------|------|:----:|--------------------|-------|:------:|
| S1 | Migraciones y seed en una base vacía | ✅ | Corren completos (cada corrida de `npm test` lo hace) | #13 | ✔ |
| S2 | Crear una fila después del seed | ✅ | 201: las secuencias de id no chocan | #13 | ✔ |
| — | La guardia rechaza una base que no es de pruebas | ✅ | Error antes de tocar la base | #18 | ✔ |

## Autenticación y permisos (`tests/auth/`)

Archivos: `login.test.js` y `matrizPermisos.test.js`. La matriz se lee de `docs/03_diseno/permisos.md` en cada corrida: si se agrega una ruta o cambia un permiso en el documento, las pruebas cambian solas. Cuando #25 corrija las diferencias, basta con actualizar la columna *Hoy* para que las 7 pruebas 🐞 pasen a ✅.

| Código | Caso | Cat. | Resultado esperado | Issue | Estado |
|--------|------|:----:|--------------------|-------|:------:|
| — | Login: correcto, contraseña o CI incorrectos, datos faltantes, empleado desactivado | ✅ | 200 con token (sin contraseña en la respuesta) / 401 / 400 / 401 | — | ✔ |
| — | Ruta protegida sin token / con el token del login | ✅ | 401 / 200 | — | ✔ |
| T1 | Token inválido o vencido | 🐞 | 401 (hoy 403) | #26 | ✔ |
| T2 | MESERO cambia la configuración de reservas | 🔄 RN-16 | 200: el mesero puede (antes figuraba como bug) | #25 | ✔ |
| T2b | Configuración con un valor negativo | 🐞 | 400 y no se guarda (hoy 200 y se guarda) | #25 | ✔ |
| T17 | MESERO o CAJERO descargan una plantilla de importación | 🐞 | 403 (hoy 200). Lo cubre MATRIZ | #25 | ✔ |
| F5 (API) | MESERO ve la asistencia del día, la lista de empleados y registra llegadas | 🐞 | 200 (hoy 403). Lo cubre MATRIZ | #25 | ✔ |
| MATRIZ | Las 69 rutas de `permisos.md` × (sin sesión + 3 roles): 265 pruebas generadas desde el documento | ✅ / 🐞 | Sin sesión: 401 (o pasa, si es pública). Rol con permiso: no 401/403. Rol sin permiso: 403. Las **7** combinaciones donde la columna *Hoy* no coincide con la matriz van como 🐞 | #25 | ✔ |

## Órdenes, pagos, comandas y dashboard (`tests/ordenes/`)

| Código | Caso | Cat. | Resultado esperado | Issue | Estado |
|--------|------|:----:|--------------------|-------|:------:|
| T5 | Orden con 2 Cappuccino (18) + 1 Catan (25) | ✅ | Total 61.00 | — | ✔ |
| T6 | Finalizar con QR 30 + EFECTIVO 31 | ✅ | Dos transacciones: QR 30.00 y EFECTIVO 31.00 (corregido en #21; antes, una EFECTIVO 61.00). Sin pagos, con un tipo o monto inválido o si la suma no da el total: 400 y la orden sigue abierta | #21 | ✔ |
| T14 / F4 | Dashboard después de T6 | ✅ | QR 30, efectivo 31 (corregido en #21; antes, QR 0). Aparte, ✅: con transacciones QR y EFECTIVO bien registradas el dashboard ya las separa; el fallo está en el cobro | #21 | ✔ |
| F3 | Dashboard con una orden cobrada (61) y otra abierta | 🐞 | Ingresos 61 (✅ pasa hoy), gráfica 61 (hoy 122), órdenes 1 (hoy 2), promedio 61 / 7 (hoy 61 / 8). Una prueba por métrica | #31 | ✔ |
| F3b | Ranking de juegos con un juego pedido 3 veces | 🐞 | Suma la cantidad (3), como el de comida (hoy cuenta 1 fila) | #31 | ✔ |
| T7 | Comandas de una orden ya cobrada o borrada | 🐞 | El ítem no aparece (hoy sí, en los dos casos) | #33 | ✔ |
| T10 | Orden con Sandwich (35); se borra el Sandwich; se agrega un Cappuccino (18) | 🐞 | Total 53.00 (hoy 18.00) | #22 | ✔ |
| T13 | Editar las notas de una orden cobrada | 🐞 | 409 (hoy 200) | #41 | ✔ |
| P2 | Cambiar la cantidad o el comentario de un juego de la orden | 🐞 | Se actualiza (hoy 404: la ruta no existe) | #42 | ✔ |
| P3 | MESERO aplica un descuento del 100 % | 🔄 RN-06 | 200 y total 0.00: sin tope ni autorización | #39 | ✔ |
| P4 | Descuento de monto mayor al total (9999) | 🔄 RN-06 | 200 y el total queda en 0.00, nunca negativo. El aviso es parte de #39 (⏳) | #39 | ✔ |
| P5 | Finalizar una orden con total 0 | ✅ | Se cierra sin pagos y sin una transacción de 0 Bs (#21). El flujo único de pago (#36) puede revisarlo | #21 | ✔ |
| P6 | Pago con QR mayor al total | ⏳ | RN-14: el QR de más no se registra; el detalle lo define #36 | #36 | — |
| P7 | Reducir la cantidad de un producto ya enviado a cocina | 🐞 | La comanda muestra la cantidad nueva (hoy la vieja) | #43 | ✔ |
| P8 | Quitar el último ítem de una orden | ⏳ | ⚠ Regla por definir: dejarla vacía o cancelarla con motivo | #44 | — |
| P9 | Abrir una orden en una mesa ocupada | 🐞 | **409** "mesa ocupada" (hoy 500) | #45 | ✔ |
| P9c | Dos pedidos **simultáneos** para abrir la misma mesa | 🐞 | Una sola orden abierta: 201 y 409. Hoy se abren **dos órdenes** en la misma mesa (`crearOrden` lee `mesa.estado` sin bloquear la fila) | #45 | ✔ |
| P9b | Abrir una orden en una mesa desactivada | 🐞 | Se rechaza (hoy se abre) | #45 | ✔ |
| P10 | El total a cobrar se lee del texto de la pantalla | 🖥 | El frontend usa el total de la API | #36 | 📋 |

Además de los casos del análisis, `tests/ordenes/` fija lo que ya funciona (✅): abrir una orden ocupa la mesa, quitar un ítem descuenta su importe, un descuento del 10 % se aplica y se quita, cobrar sin detalle registra EFECTIVO por el total y libera la mesa, una orden cobrada no se cobra dos veces, el filtro de comandas por zona y el avance recibido → preparando → terminado → enviado.

## Reservas (`tests/reservas/`)

| Código | Caso | Cat. | Resultado esperado | Issue | Estado |
|--------|------|:----:|--------------------|-------|:------:|
| T9 | Dos reservas que se cruzan en la misma mesa | ✅ | La segunda se rechaza | — | ✔ |
| T9b | Dos reservas de la misma mesa separadas por más que `ventana_bloqueo` | ✅ | Las dos se crean | — | ✔ |
| T9c | Editar una reserva: cambiar el estado, o reenviar la misma `mesa_id` como número | ✅ | 200 | — | ✔ |
| T9d | Editar una reserva reenviando la misma `mesa_id` **como texto** (como lo hace el formulario) | 🐞 | 200 (hoy 500: la reserva choca consigo misma). El análisis la daba por buena porque se probó con un número | #50 | ✔ |
| T9e | Marcar LLEGO o CANCELADA una reserva cuya hora ya pasó, reenviando la misma hora | ✅ | 200. #50 temía un error de `isFuture`: no ocurre, porque Sequelize solo valida los campos que cambian | #50 | ✔ |
| R2 | Abrir una orden en una mesa con reserva dentro de `ventana_llegada` | ✅ | La reserva pasa a LLEGÓ; fuera de la ventana sigue PENDIENTE; en `GET /mesas` la mesa aparece reservada (estado 3) | — | ✔ |
| R3 | Reserva vencida (pasada la tolerancia de `minutos_tolerancia`) | ✅ | Pasa a EXPIRADA al listar las reservas, y la mesa reservada vuelve a libre al listar las mesas | RN-02 | ✔ |
| R4 | Cancelar una reserva (`DELETE`) | 🐞 | La reserva queda en CANCELADA (RF-28). Hoy se borra (soft delete); lo que sí funciona (✅) es que el horario queda libre | #50 | ✔ |
| R1 | La fecha por defecto del formulario de reservas después de las 20:00 | 🖥 | El día de hoy en Bolivia (hoy, el de mañana por usar UTC) | #27 | 📋 |

Las pruebas leen `ventana_bloqueo`, `ventana_llegada` y `minutos_tolerancia` de la configuración en lugar de fijar los minutos, así que no cambian cuando se ajusta el seed (#98) o cuando el ADMIN edita los valores (#51).

## Asistencia (`tests/asistencia/`)

| Código | Caso | Cat. | Resultado esperado | Issue | Estado |
|--------|------|:----:|--------------------|-------|:------:|
| A1 | Registrar dos veces la llegada del mismo empleado el mismo día | 🐞 | La segunda responde 409 (hoy 201) | #30 | ✔ |
| A2 | Aprobar con contraseña incorrecta o con la firma de un MESERO | ✅ | 401 y la asistencia sigue sin aprobar | — | ✔ |
| A3 | Aprobar con la firma del ADMIN o del CAJERO | ✅ | 200 y queda aprobada | — | ✔ |
| A4 | Borrar una asistencia aprobada sin firma | 🐞 | Se rechaza y no se borra (hoy 200 y borrado físico). Quitar una asistencia **sin aprobar** sí funciona (✅) | #30 | ✔ |
| A5 | Guardar un horario con hora de salida | 🐞 | Se guardan entrada y salida (hoy solo la entrada) | #61 | ✔ |
| A5b | Editar los horarios de un empleado con asistencias anteriores | 🐞 | El horario usado por las asistencias sigue existiendo (hoy se borra: `destroy` + `bulkCreate`) | #61 | ✔ |
| A6 | El navegador envía un descuento por atraso que no corresponde | 🐞 | Un empleado puntual que manda el −100 % queda sin descuento (hoy guarda el enviado). Los bordes de RN-01 (9:59, 10:00… 25:01) se prueban en el PR de #29 | #29 | ✔ |
| T11 | Registrar la llegada de un empleado sin horario ese día | 🐞 | 400 con un mensaje claro (hoy 500) | #28 | ✔ |

## Catálogo y espacio (`tests/catalogo/`)

| Código | Caso | Cat. | Resultado esperado | Issue | Estado |
|--------|------|:----:|--------------------|-------|:------:|
| F2 | Crear o editar un juego con categorías | 🐞 | 201/200 y las categorías guardadas (hoy 500 al crear y al editar) | #24 | ✔ |
| C1 | Editar un producto conservando una de sus categorías | 🐞 | 200 y el producto conserva sus categorías (hoy 400 y queda sin ninguna) | #78 | ✔ |
| T4 | Crear una mesa sin nombre | 🐞 | 400 (hoy 500) | #28 | ✔ |
| C2 | Crear un juego sin `tiempo_partida` | 🐞 | 400 (hoy 500) | #28 | ✔ |
| C3 | Crear un empleado con dirección | 🐞 | La dirección se guarda (hoy se descarta) | #28 | ✔ |
| T12 | Crear un producto o un juego con precio 0 | ⏳ | Hoy 400. Si el precio 0 es válido lo confirma el dueño (⚠ en #52); la prueba se escribe en el PR de #52 con la regla confirmada | #52 | — |
| P1 | Crear un producto con una zona que no es `COCINA` ni `CAFETERIA` | 🐞 | 400 (hoy 201 con cualquier texto) | #32 | ✔ |
| T16 | Catálogo de juegos sin sesión | ✅ / ⏳ | 200 sin token, con los juegos del seed (catálogo por QR). Si se muestran los juegos desactivados lo decide el dueño (P-18) | #58 | ✔ |
| — | CRUD básico de categorías, productos, juegos, pisos y mesas (ADMIN), datos obligatorios (400) y capacidad máxima menor a la mínima (4xx) | ✅ | 201 / 200 / 400 | — | ✔ |

## Solo del navegador (pruebas manuales)

| Código | Caso | Resultado esperado | Issue |
|--------|------|--------------------|-------|
| T8 / F1 | Cliente con nombre `<img src=x onerror=…>` y buscarlo en *Nueva reserva* | El nombre se ve como texto; no se ejecuta nada. (La API guarda el texto tal cual y lo devuelve en JSON: eso es correcto; el problema es cómo lo inserta el frontend) | #23 |
| F5 (UI) | El MESERO entra a *Asistencia* | Si el servidor responde 403, la pantalla muestra un error de permisos, no "No hay turnos pendientes" | #63 |
| F6 | Pantalla de mesas en 390 px de ancho | El menú se colapsa y las tarjetas no se cortan | #73 |
| F7 | Consola del navegador al recorrer las pantallas | Sin errores 404 ni 403 propios | #63, #96 |
| P1 (UI) | Un producto de zona `CAFETERIA` en el POS | Aparece en la pestaña de bebidas | #32 |
| P10 | Cobrar una orden de más de 1000 Bs | El monto a cobrar es el total de la API | #36 |
| R1 | Abrir *Nueva reserva* después de las 20:00 | La fecha por defecto es la de hoy | #27 |
| T15 | Cerrar el día y entrar desde otro navegador | El día figura cerrado (hoy solo en el navegador que lo cerró) | #34 ⏳ |
