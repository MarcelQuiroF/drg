# Matriz de brechas

> **24/11/2026 · Versión 0.1.** Compara cada requisito de [`requisitos.md`](requisitos.md) con el sistema tal como está en `main` (commit `cb210d6`).
> El estado sale del análisis técnico del proyecto (4 revisiones del código, con pruebas en ejecución, noviembre de 2026). Los códigos entre paréntesis (`T6`, `F2`, `§4.1`…) son las pruebas y secciones de ese análisis. Lo marcado **[verificar]** se dedujo del código, pero no se probó.
> Esta matriz es la base del backlog de la **Etapa 2**: cada fila con ⚠, 🟡 o ❌ que el dueño confirme se convierte en una issue.

## Leyenda

| Estado | Significado | Qué se hace |
|:------:|-------------|-------------|
| ✅ | Está y funciona | Nada (solo pruebas automáticas en la Etapa 3) |
| ⚠ | Está, pero con errores | Issue de tipo **bug** (Etapa 4 si toca dinero o seguridad) |
| 🟡 | Está a medias | Issue de **mejora** o **historia de usuario** (Etapa 6) |
| ❌ | No existe | **Historia de usuario** (Etapa 6), si el dueño la confirma |
| ➖ | Fuera de alcance | Se documenta y se cierra |

## Resumen

| Módulo | ✅ | ⚠ | 🟡 | ❌ | ➖ |
|--------|:--:|:--:|:--:|:--:|:--:|
| Mesas y espacio (RF-01 a 06) | 2 | 1 | 1 | 2 | — |
| Órdenes (RF-07 a 13) | — | 6 | 1 | — | — |
| Comandas (RF-14 a 16) | — | 2 | 1 | — | — |
| Pagos y caja (RF-17 a 24) | 1 | 2 | 2 | 2 | 1 |
| Reservas y clientes (RF-25 a 30) | 3 | 2 | 1 | — | — |
| Productos (RF-31 a 36) | 1 | 2 | 1 | 2 | — |
| Juegos (RF-37 a 40) | — | 2 | 1 | 1 | — |
| Empleados y asistencia (RF-41 a 45) | — | 4 | — | 1 | — |
| Reportes (RF-46 a 51) | 1 | 2 | — | 3 | — |
| Seguridad y auditoría (RF-52 a 54) | — | 1 | — | 2 | — |
| **Total (54 requisitos)** | **8** | **24** | **8** | **13** | **1** |

**Lectura rápida:** 40 de los 54 requisitos **ya existen** en el sistema, pero solo 8 funcionan sin errores; faltan 13. Lo que más pesa para el negocio:

1. **Cobro:** los pagos QR se registran como efectivo (T6) y la cuenta individual por ítems no existe (RF-18), justo lo que el dueño dijo que era la única complicación.
2. **Cierre de caja:** no existe en el servidor (RF-22). Hoy es un dato del navegador.
3. **Control de juegos con código** (RF-39): lo que el dueño ve más necesario, y no existe.
4. **Asistencia:** el descuento lo decide el navegador y el servidor acepta cualquiera (A6).

## Detalle

### Mesas y espacio

| Req. | Estado | Situación actual | Acción |
|------|:------:|------------------|--------|
| RF-01 | ✅ | Mapa de mesas por piso con colores por estado. No es responsive (F6), eso va en RNF-03 | Pruebas |
| RF-02 | ✅ | `capacidad_min`/`capacidad_max` con validación en el modelo | — |
| RF-03 | ⚠ | Crear una mesa sin nombre da 500 (T4); se permiten números repetidos en el mismo piso; se puede borrar un piso con mesas o una mesa con orden abierta (§10.3) | Bug, Etapa 4 |
| RF-04 | ❌ | La mesa no guarda posición en el plano | Preguntar (P-16) |
| RF-05 | ❌ | No hay estado "sucia" | Preguntar (P-16) |
| RF-06 | 🟡 | Al abrir una orden, una reserva cercana se marca sola como `LLEGO` (`registrarLlegadaAutomatica`), pero no se avisa al personal **[verificar en la UI]** | Mejora, Etapa 6 |

### Órdenes

| Req. | Estado | Situación actual | Acción |
|------|:------:|------------------|--------|
| RF-07 | ⚠ | Funciona, pero un doble clic abre dos peticiones y muestra un error aunque la orden se abrió (P9) | Bug menor |
| RF-08 | ⚠ | **Borrar un producto del catálogo baja el total de las órdenes abiertas** (T10); no existe la ruta para cambiar la cantidad de un juego (P2); bajar una cantidad no actualiza la comanda (P7); quitar el último ítem borra la orden sin registro (P8) | Bug crítico (T10), Etapa 4 |
| RF-09 | ⚠ | Comentarios de productos ✅; comentarios de juegos dan 404 (P2) | Bug |
| RF-10 | ⚠ | Los productos con zona `Barra` no aparecen en el POS (P1): el vocabulario de zonas no está unificado | Bug, Etapa 4 |
| RF-11 | ⚠ | El descuento existe, pero el comentario es opcional en el modelo **[verificar en la UI]**, y un MESERO puede aplicar un 100 % o 9999 Bs sin autorización (P3, P4) | Bug + definir RN-06 (P-06) |
| RF-12 | ⚠ | Se pueden editar las notas de una orden finalizada (T13) | Bug menor |
| RF-13 | 🟡 | `crearOrden` recibe el usuario pero no lo guarda (§4.1-4); los pagos tampoco guardan quién cobró | Mejora, Etapa 6 |

### Comandas

| Req. | Estado | Situación actual | Acción |
|------|:------:|------------------|--------|
| RF-14 | ⚠ | Existe el campo `zona`, pero conviven `COCINA`, `CAFETERIA`, `BARRA`, `Barra`, `Cocina` (P1) | Bug (junto con RF-10) |
| RF-15 | ⚠ | Hay vista de impresión con selección y contadores (`imprimir-comanda.html`), pero las comandas de órdenes cobradas siguen apareciendo (T7) **[verificar el flujo completo de impresión, §9]** | Bug + prueba |
| RF-16 | 🟡 | Existen los estados recibido → preparando → terminado → enviado, pero la actualización es cada 30 s, no en tiempo real | Preguntar si cocina usa pantalla (P-10) |

### Pagos y caja

| Req. | Estado | Situación actual | Acción |
|------|:------:|------------------|--------|
| RF-17 | ⚠ | **Al finalizar, todos los pagos se guardan como EFECTIVO** (T6): el dashboard nunca muestra QR (T14, F4) | **Bug crítico**, Etapa 4 (primero de la lista) |
| RF-18 | 🟡 | Se pueden registrar pagos parciales **por monto** (`POST /pagos`), pero no asignar ítems a cada pago. Hay dos flujos de pago distintos (§4.1-2) | Historia de usuario + unificar flujo (P-02) |
| RF-19 | 🟡 | La tabla de pagos tiene `cliente_id`, pero la interfaz no lo pide **[verificar]** | Mejora |
| RF-20 | ⚠ | No hay manejo de vuelto cuando el QR supera el total (P6); se registran pagos de 0 Bs (P5) | Bug |
| RF-21 | ✅ | La mesa se libera solo al saldar (con dos tolerancias distintas, ver RN-07) | Unificar con RF-18 |
| RF-22 | ❌ | El "cierre del día" se guarda en el navegador (`localStorage`); el servidor sigue aceptando órdenes (§4.7). La ruta de cierre existe en el código pero no está montada (T15) | Historia de usuario, Etapa 6 (alta) |
| RF-23 | ❌ | No hay monto inicial ni arqueo | Preguntar (P-09) |
| RF-24 | ➖ | No hay facturación. El negocio no factura | Futuro (P-11) |

### Reservas y clientes

| Req. | Estado | Situación actual | Acción |
|------|:------:|------------------|--------|
| RF-25 | 🟡 | La reserva guarda cliente, mesa y hora; **no guarda la cantidad de personas** | Mejora (campo nuevo) |
| RF-26 | ✅ | El choque de reservas se detecta bien (T9); la ventana de ±120 min no la definió el negocio (RN-12) | Preguntar (P-05) |
| RF-27 | ⚠ | El validador de hora futura impide **editar** una reserva pasada (por ejemplo, para marcarla como cancelada) **[verificar]** (§4.4) | Bug |
| RF-28 | ⚠ | Editar funciona (T9c), pero borrar hace soft-delete sin usar el estado `CANCELADA` (§4.4); la fecha por defecto pasa al día siguiente después de las 20:00 (R1) | Bug |
| RF-29 | ✅ | Las reservas vencidas pasan a `EXPIRADA` y liberan la mesa. Se recalcula en cada consulta (§4.4) y la tolerancia por defecto es 20 min, no 30 (RN-02) | Ajustar valor (P-05) y optimizar |
| RF-30 | ✅ | Búsqueda por nombre o CI. Tiene **XSS confirmado** en el buscador (F1), que va como bug de seguridad aparte | Bug de seguridad, Etapa 4 |

### Productos

| Req. | Estado | Situación actual | Acción |
|------|:------:|------------------|--------|
| RF-31 | ⚠ | CRUD funciona; no acepta precio 0 (T12); el update acepta cualquier campo del body (§10.3) | Bug menor |
| RF-32 | ❌ | El producto no tiene costo | Preguntar (P-12) |
| RF-33 | ⚠ | Solo el ADMIN puede cambiar el estado (con `PUT`); el CAJERO no puede marcar agotado. La función `toggleEstado` existe pero no tiene ruta (§10.3). El producto tiene dos booleanos (`activado` y `estado`) sin un propósito claro (§3) | Bug + mejora |
| RF-34 | ❌ | No se validan duplicados **[verificar]** | Mejora |
| RF-35 | 🟡 | Se crean y borran categorías; no hay ruta para editarlas (§10.3) | Mejora |
| RF-36 | ✅ | Importación por Excel con plantillas; falta permiso ADMIN en las plantillas (T17) y límites de archivo (§5); `xlsx@0.18.5` tiene vulnerabilidades | Seguridad, Etapa 6 |

### Juegos

| Req. | Estado | Situación actual | Acción |
|------|:------:|------------------|--------|
| RF-37 | ⚠ | **Crear o editar un juego con categorías da 500** (F2). No hay campos de edad mínima ni tamaño | Bug crítico (F2) + campos nuevos |
| RF-38 | ⚠ | Se cobra precio × cantidad, que coincide con RN-04 ✅. Las horas de inicio y fin se guardan mal (zona horaria del servidor, `Date` en columna `TIME`, §4.3) | Bug menor. **Resuelve la duda §4.3 del análisis:** el cobro por tiempo no hace falta |
| RF-39 | ❌ | No existe lectura de código | Historia de usuario (P-03) |
| RF-40 | 🟡 | Existe `catalogo.html` público; muestra juegos desactivados y no aplica el filtro por categoría (T16); la URL de la API está fija en `localhost` (§5) | Mejora (P-18) |

### Empleados y asistencia

| Req. | Estado | Situación actual | Acción |
|------|:------:|------------------|--------|
| RF-41 | ⚠ | CRUD funciona, pero la `direccion` se descarta en silencio (§10.2); no se validan formatos; el seed crea al admin con rol CAJERO (S1) | Bug, Etapa 3–4 |
| RF-42 | ⚠ | Solo se guarda la hora de entrada; `hora_salida` se descarta (A5); al editar se pierden los horarios viejos (§4.5) | Bug |
| RF-43 | ⚠ | Hay registro con aprobación por firma (A2, A3 ✅), pero se puede registrar dos veces el mismo día (A1), borrar una aprobada sin firma (A4) y falla si el empleado no tiene horario ese día (T11) | Bug, Etapa 4 |
| RF-44 | ⚠ | **El atraso lo calcula el navegador y el servidor acepta cualquier descuento** (A6). El servicio de asistencia del backend está roto y asigna descuentos al azar (§4.5) | Bug crítico, después de definir RN-01 (P-07) |
| RF-45 | ❌ | El empleado no tiene sueldo | Preguntar (P-08) |

### Reportes

| Req. | Estado | Situación actual | Acción |
|------|:------:|------------------|--------|
| RF-46 | ⚠ | Dashboard con atajos de fecha, pero los rangos se desfasan 4 horas (UTC, §4.6) y el promedio diario divide por 8 días (F3) | Bug, Etapa 4 |
| RF-47 | ⚠ | Muestra los indicadores, pero mezcla fuentes (órdenes abiertas en la gráfica, transacciones en el total, F3), usa precios actuales y no los cobrados (§3) y el QR siempre sale 0 (F4) | Bug + guardar precio histórico |
| RF-48 | ❌ | Sin costo no hay ganancia (depende de RF-32) | Según P-12 |
| RF-49 | ❌ | No hay listado de descuentos de órdenes con comentario | Mejora |
| RF-50 | ❌ | No se guarda el empleado de cada operación (depende de RF-13) | Mejora |
| RF-51 | ✅ | El dashboard está en el panel de admin y sus rutas piden rol ADMIN | — |

### Seguridad y auditoría

| Req. | Estado | Situación actual | Acción |
|------|:------:|------------------|--------|
| RF-52 | ⚠ | Hay JWT y roles, pero varias rutas solo piden sesión: un MESERO cambia la configuración (T2); el token vencido da 403 y el frontend espera 401 (T1); no hay límite de intentos de login (§5) | Bug de seguridad, Etapa 4 |
| RF-53 | ❌ | Las tablas `Registro*` existen, pero nada las llena (§3) | Preguntar (P-19) |
| RF-54 | ❌ | No hay respaldos | Etapa 7 (P-14) |

## Reglas de negocio frente al sistema

| Regla | Qué hace el sistema hoy | Diferencia |
|-------|-------------------------|------------|
| RN-01 Descuento por atraso | El seed tiene una sola regla: 15 min → 10. El cálculo lo hace el frontend | ❌ No coincide con la tabla de los documentos |
| RN-02 Tolerancia de reserva 30 min | `minutos_tolerancia` = 20 por defecto | ⚠ Valor distinto |
| RN-04 Juegos por préstamo | Precio × cantidad | ✅ Coincide |
| RN-06 Descuento con comentario y autorización | Comentario opcional en el modelo; cualquier rol aplica cualquier monto | ⚠ Falta la regla |
| RN-07 Cerrar al saldar | Dos tolerancias: 0.01 Bs (`/finalizar`) y 0.5 Bs (`/pagos`) | ⚠ Unificar |
| RN-08 Agotado no se vende | El POS oculta los desactivados **[verificar]**; el cajero no puede marcar agotado | 🟡 |
| RN-09 No borrar, desactivar | Soft-delete (`paranoid`) en casi todo; la asistencia se borra físicamente (A4) | ⚠ |
| RN-10 Confirma un cajero, mozo o admin | Solo ADMIN y CAJERO | ⚠ Confirmar con el dueño |
| RN-12 Bloqueo ±120 min | `ventana_bloqueo` = 120 | ⚠ Valor puesto por el equipo |
| RN-13 Catálogo muestra todo | Muestra todo, incluso desactivados (T16) | ✅ Coincide con CU 3.1, aunque el análisis lo marcó como problema. Decide el dueño (P-18) |

## Lo que hay que corregir en la documentación del Drive

Los documentos del equipo se usan como fuente, pero tienen errores que no se deben copiar a los documentos nuevos ni repetir en una presentación:

1. **Arquitectura desactualizada.** `INGENIERÍA DE REQUERIMIENTOS` §6.3 describe una arquitectura en la nube (Supabase como BaaS, Supabase Auth con RLS). El sistema real es un backend propio en Express con JWT, y la entrega será local. `DRG` (2025) también dice que la base está en Supabase.
2. **Pantallas de cocina frente a impresión.** El mismo documento habla de pantallas KDS "eliminando el uso de papel", mientras que los casos de uso y el local trabajan con **comandas impresas**.
3. **"Validar stock".** IR §5.1 dice que el sistema valida stock, pero no hay inventario: solo el estado "agotado".
4. **Roles inconsistentes.** Según el documento aparecen "Rol de Atención", "Mozo", "Barista", "Chef" o "Cocina"; el sistema tiene ADMIN, CAJERO y MESERO.
5. **Casos de uso con errores de redacción.** En CU 2.5 ("Gestionar espacio") el propósito está copiado del caso 2.4. CU 1.1 repite el paso 15. CU 1.8 valida la contraseña *después* de guardar la llegada.
6. **Tolerancias que no coinciden.** Los documentos dicen 30 min para reservas; el sistema y el documento técnico de servicios usan 20 min.
7. **Descripción de servicios.** El documento técnico de los servicios del backend presenta el descuento aleatorio de `asistenciaService` como una funcionalidad ("descuento estocástico"). Es un error: el descuento tiene que salir de la tabla RN-01.
8. **Códigos HTTP.** `DRG` (2025) dice que el token vencido responde 401; el sistema responde 403 (T1).
9. **Detalles menores en `Entrevista DRG.pdf`:** la sección de reportes se titula otra vez "Interacción con Clientes", y la lista del cliente empieza en el número 3.

## Historial

| Versión | Fecha | Cambio |
|---------|-------|--------|
| 0.1 | 24/11/2026 | Primera versión (issue #4) |
