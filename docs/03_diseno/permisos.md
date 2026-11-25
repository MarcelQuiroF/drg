# Matriz de permisos por rol y endpoint

> **25/11/2026 · Versión 0.1** · Issue #9 · Requisito RF-52.
> Dice **qué puede hacer cada rol en cada endpoint** de la API (`/api/v1`) y lo compara con lo que hace hoy el código de `main`. La corrección en el código va en la issue #25.

## Roles

| Rol | Quién es | Pantallas que usa hoy |
|-----|----------|-----------------------|
| `ADMIN` | El dueño o el encargado | `indexAdmin.html` (panel de administración) |
| `CAJERO` | Cobra, abre y cierra la caja, confirma la asistencia | `index.html` (misma pantalla que el mesero) |
| `MESERO` | Toma pedidos, maneja mesas y reservas | `index.html` |
| Público | Cliente del café, sin sesión | `catalogo.html` (catálogo de juegos por QR) |

Cocina y cafetería **no usan el sistema**: solo reciben la comanda impresa (P-10). No hay rol para ellas.

## Cómo se protege hoy una ruta

| Mecanismo | Dónde | Qué hace |
|-----------|-------|----------|
| `authenticate` | `middlewares/authMiddleware.js` | Exige un token JWT válido. Sin token responde 401; con un token inválido o vencido responde **403** (bug #26) |
| `authorize([...])` | `middlewares/roleMiddleware.js` | Exige que el rol del token esté en la lista. Si no está, responde 403 |
| Chequeo a mano | Algunos controladores | Revisan `req.empleado.rol` dentro de la función. Duplica o reemplaza a `authorize` (ver más abajo) |

## Leyenda

| Símbolo | Significado |
|:-------:|-------------|
| ✅ | El rol puede usar el endpoint |
| ❌ | El servidor tiene que responder 403 |
| 🌐 | Público: no hace falta sesión |
| ⚠ | Valor de prueba o pendiente de confirmar con el dueño; se usa mientras tanto |

La columna **Hoy** dice qué protección tiene la ruta en el código: `público`, `sesión` (solo `authenticate`, o sea cualquier rol), o la lista de roles de `authorize`. La columna **Dif.** marca con **≠** las filas donde el código no coincide con la matriz; esas son las que corrige #25.

## Matriz

### Autenticación y empleados

| Método | Ruta | ADMIN | CAJERO | MESERO | Hoy | Dif. | Notas |
|--------|------|:-----:|:------:|:------:|-----|:----:|-------|
| POST | `/auth/login` | 🌐 | 🌐 | 🌐 | público | | Falta límite de intentos (#69) |
| GET | `/empleados/perfil` | ✅ | ✅ | ✅ | sesión | | Devuelve el contenido del token, no la BD (#60) |
| GET | `/empleados` | ✅ | ✅ | ❌ | ADMIN, CAJERO | | El cajero la usa en la pantalla de asistencia |
| POST | `/empleados` | ✅ | ❌ | ❌ | ADMIN | | |
| PUT | `/empleados/:id` | ✅ | ❌ | ❌ | ADMIN | | |

### Catálogo (categorías, productos y juegos)

| Método | Ruta | ADMIN | CAJERO | MESERO | Hoy | Dif. | Notas |
|--------|------|:-----:|:------:|:------:|-----|:----:|-------|
| GET | `/categorias` | 🌐 | 🌐 | 🌐 | público | | La usa el catálogo de clientes |
| POST | `/categorias` | ✅ | ❌ | ❌ | ADMIN | | |
| DELETE | `/categorias/:id` | ✅ | ❌ | ❌ | ADMIN | | |
| GET | `/productos` | ✅ | ✅ | ✅ | sesión | | |
| GET | `/productos/:id` | ✅ | ✅ | ✅ | sesión | | |
| POST | `/productos` | ✅ | ❌ | ❌ | ADMIN + chequeo a mano | ≠ | Quitar el chequeo duplicado del controlador |
| PUT | `/productos/:id` | ✅ | ❌ | ❌ | ADMIN + chequeo a mano | ≠ | Ídem |
| DELETE | `/productos/:id` | ✅ | ❌ | ❌ | ADMIN + chequeo a mano | ≠ | Ídem |
| GET | `/juegos` | 🌐 | 🌐 | 🌐 | público | | Catálogo de clientes. Qué juegos mostrar: P-18 (#58) |
| GET | `/juegos/:id` | 🌐 | 🌐 | 🌐 | público | | |
| POST | `/juegos` | ✅ | ❌ | ❌ | ADMIN | | |
| PUT | `/juegos/:id` | ✅ | ❌ | ❌ | ADMIN | | |
| DELETE | `/juegos/:id` | ✅ | ❌ | ❌ | ADMIN | | |

### Espacio (pisos y mesas)

| Método | Ruta | ADMIN | CAJERO | MESERO | Hoy | Dif. | Notas |
|--------|------|:-----:|:------:|:------:|-----|:----:|-------|
| GET | `/pisos` | ✅ | ✅ | ✅ | sesión | | |
| POST | `/pisos` | ✅ | ❌ | ❌ | ADMIN | | |
| PUT | `/pisos/:id` | ✅ | ❌ | ❌ | ADMIN | | |
| DELETE | `/pisos/:id` | ✅ | ❌ | ❌ | ADMIN | | Validaciones faltantes (#48) |
| GET | `/mesas` | ✅ | ✅ | ✅ | sesión | | |
| POST | `/mesas` | ✅ | ❌ | ❌ | ADMIN | | |
| PUT | `/mesas/:id` | ✅ | ❌ | ❌ | ADMIN | | |
| DELETE | `/mesas/:id` | ✅ | ❌ | ❌ | ADMIN | | Validaciones faltantes (#48) |

### Órdenes, ítems y descuentos

| Método | Ruta | ADMIN | CAJERO | MESERO | Hoy | Dif. | Notas |
|--------|------|:-----:|:------:|:------:|-----|:----:|-------|
| GET | `/ordenes` | ✅ | ✅ | ✅ | sesión | | |
| GET | `/ordenes/:id` | ✅ | ✅ | ✅ | sesión | | |
| POST | `/ordenes` | ✅ | ✅ | ✅ | sesión | | Con el día cerrado responde 409 (#34) |
| PUT | `/ordenes/:id` | ✅ | ✅ | ✅ | los 3 roles | | Notas. No si la orden está cobrada (#41) |
| DELETE | `/ordenes/:id` | ✅ | ✅ | ✅ ⚠ | los 3 roles | | ⚠ Quién puede borrar o cancelar una orden con ítems ya enviados a cocina: pendiente (P-21, #44) |
| POST | `/ordenes/:id/finalizar` | ✅ | ✅ | ❌ ⚠ | los 3 roles | ≠ | RF-17 dice que **cobra el cajero**. ⚠ Confirmar con el dueño el 10/12 si el mesero también cobra (P-21); hasta entonces, se aplica RF-17 |
| POST | `/ordenes/:id/descuento` | ✅ | ✅ | ✅ | los 3 roles | | RN-06: cajero y mesero, sin tope. Motivo obligatorio (#39) |
| GET | `/ordenes/:id/descuentos` | ✅ | ✅ | ✅ | los 3 roles | | |
| DELETE | `/ordenes/:ordenId/descuento/:descuentoId` | ✅ | ✅ | ✅ | los 3 roles | | |
| GET | `/ordenes-productos` | ✅ | ✅ | ✅ | sesión | | |
| POST | `/ordenes-productos` | ✅ | ✅ | ✅ | sesión | | |
| PUT | `/ordenes-productos/:id` | ✅ | ✅ | ✅ | sesión | | Lista blanca de campos (#43) |
| DELETE | `/ordenes-productos/:id` | ✅ | ✅ | ✅ | sesión | | |
| GET | `/ordenes-juegos` | ✅ | ✅ | ✅ | sesión | | |
| POST | `/ordenes-juegos` | ✅ | ✅ | ✅ | sesión | | |
| PATCH | `/ordenes-juegos/:id/terminar` | ✅ | ✅ | ✅ | sesión | | |
| DELETE | `/ordenes-juegos/:id` | ✅ | ✅ | ✅ | sesión | | Falta `PUT /ordenes-juegos/:id` (#42) |

### Pagos

| Método | Ruta | ADMIN | CAJERO | MESERO | Hoy | Dif. | Notas |
|--------|------|:-----:|:------:|:------:|-----|:----:|-------|
| GET | `/pagos` | ✅ | ✅ | ❌ ⚠ | sesión | ≠ | Sigue la decisión de `finalizar` (RF-17) |
| POST | `/pagos` | ✅ | ✅ | ❌ ⚠ | sesión | ≠ | Ídem. El frontend no usa esta ruta hoy; se unifica con `finalizar` en #36 |
| DELETE | `/pagos/:id` | ✅ | ✅ | ❌ | sesión + chequeo a mano | ≠ | Anular un pago. Hoy el controlador rechaza al mesero a mano: pasar a `authorize` |

### Clientes y reservas

| Método | Ruta | ADMIN | CAJERO | MESERO | Hoy | Dif. | Notas |
|--------|------|:-----:|:------:|:------:|-----|:----:|-------|
| GET | `/clientes` | ✅ | ✅ | ✅ | sesión | | RN-03: las reservas siempre las registra el personal |
| POST | `/clientes` | ✅ | ✅ | ✅ | sesión | | |
| PUT | `/clientes/:id` | ✅ | ✅ | ✅ | sesión | | CI duplicado al editar (#64) |
| DELETE | `/clientes/:id` | ✅ | ❌ | ❌ | ADMIN | | |
| GET | `/reservas` | ✅ | ✅ | ✅ | sesión | | |
| GET | `/reservas/:id` | ✅ | ✅ | ✅ | sesión | | |
| POST | `/reservas` | ✅ | ✅ | ✅ | sesión | | |
| PUT | `/reservas/:id` | ✅ | ✅ | ✅ | sesión | | |
| DELETE | `/reservas/:id` | ✅ | ✅ | ✅ | sesión | | Tiene que cancelar, no borrar (#50) |

### Comandas

| Método | Ruta | ADMIN | CAJERO | MESERO | Hoy | Dif. | Notas |
|--------|------|:-----:|:------:|:------:|-----|:----:|-------|
| GET | `/comandas` | ✅ | ✅ | ✅ | sesión | | Cocina y cafetería no entran al sistema: el personal imprime las comandas |
| POST | `/comandas/:id/avanzar` | ✅ | ✅ | ✅ | sesión | | |

### Asistencia

| Método | Ruta | ADMIN | CAJERO | MESERO | Hoy | Dif. | Notas |
|--------|------|:-----:|:------:|:------:|-----|:----:|-------|
| GET | `/asistencias/hoy` | ✅ | ✅ | ❌ | ADMIN, CAJERO | | El menú se le muestra igual al mesero (#63) |
| POST | `/asistencias` | ✅ | ✅ | ❌ | ADMIN, CAJERO | | Se registra en la caja, pero con el CI y la contraseña **del propio empleado** (RF-43, #30) |
| PUT | `/asistencias/:id/aprobar` | ✅ | ✅ ⚠ | ❌ | ADMIN, CAJERO | | Además pide la firma (CI y contraseña) de un ADMIN o CAJERO. RN-10: el cajero confirma (valor de prueba) |
| DELETE | `/asistencias/:id` | ✅ | ✅ ⚠ | ❌ | ADMIN, CAJERO | | Tiene que anular con firma, no borrar (#30) |

### Reportes, configuración e importación

| Método | Ruta | ADMIN | CAJERO | MESERO | Hoy | Dif. | Notas |
|--------|------|:-----:|:------:|:------:|-----|:----:|-------|
| GET | `/reportes/dashboard` | ✅ | ❌ | ❌ | ADMIN | | RF-51 |
| GET | `/configuracion` | ✅ | ✅ | ✅ | sesión | | La pantalla de reservas lee las ventanas de tiempo |
| GET | `/configuracion/descuentos-atraso` | ✅ | ✅ | ❌ | sesión | ≠ | Solo lo usa la pantalla de asistencia |
| PUT | `/configuracion` | ✅ | ❌ | ❌ | sesión | ≠ | **T2:** hoy un mesero cambia las tolerancias. Ver *Efectos en el frontend* |
| POST | `/importacion/productos` | ✅ | ❌ | ❌ | ADMIN | | |
| POST | `/importacion/juegos` | ✅ | ❌ | ❌ | ADMIN | | |
| GET | `/importacion/plantillas/productos` | ✅ | ❌ | ❌ | sesión | ≠ | T17 |
| GET | `/importacion/plantillas/juegos` | ✅ | ❌ | ❌ | sesión | ≠ | T17 |

`routes/reporteRoute.js` define `GET /reportes/cierre-dia` (ADMIN, CAJERO), pero **no está montada** en `app.js` (T15). El cierre del día se rehace en #34.

## Resumen de diferencias (lo que corrige #25)

| # | Ruta | Hoy | Debería | Motivo |
|---|------|-----|---------|--------|
| 1 | `PUT /configuracion` | sesión | ADMIN | T2: cualquier rol cambia reglas del negocio |
| 2 | `GET /configuracion/descuentos-atraso` | sesión | ADMIN, CAJERO | Solo la usa asistencia |
| 3 | `GET /importacion/plantillas/*` (2 rutas) | sesión | ADMIN | T17 |
| 4 | `POST /ordenes/:id/finalizar` | los 3 roles | ADMIN, CAJERO ⚠ | RF-17 (P-21, confirmar el 10/12) |
| 5 | `GET` y `POST /pagos` | sesión | ADMIN, CAJERO ⚠ | RF-17 (confirmar el 10/12) |
| 6 | `DELETE /pagos/:id` | sesión + chequeo a mano | ADMIN, CAJERO | Mismo permiso, pero con `authorize` |
| 7 | `POST`, `PUT`, `DELETE /productos` | ADMIN + chequeo a mano | ADMIN | Quitar el chequeo duplicado |

De las **69 rutas** montadas, **8** cambian de protección y **3** solo pierden el chequeo duplicado. Las otras 58 ya coinciden con la matriz.

Las filas 4 y 5 son las únicas que **quitan** algo que el mesero hace hoy. Si el dueño confirma que el mesero también cobra, se vuelven a abrir y la matriz se actualiza.

## Efectos en el frontend

- **Configuración de tiempos de reserva:** `reservas.js` (pantalla del mesero y del cajero) tiene un modal que hace `PUT /configuracion`. Con la matriz, ese modal se muestra solo al ADMIN o se mueve al panel de administración (#25).
- **Cobro:** si el mesero no cobra, el botón de cobrar en la orden se oculta para el MESERO (#25).
- **Menú de asistencia:** se muestra solo a ADMIN y CAJERO (#63).
- **Mensajes:** un 403 se muestra como error de permisos, no como lista vacía (#63); un 401 vuelve al login (#26).
- El rol guardado en `localStorage` sirve solo para la interfaz. La protección real es la del servidor.

## Endpoints nuevos previstos en el backlog

| Endpoint (nombre tentativo) | ADMIN | CAJERO | MESERO | Fuente |
|-----------------------------|:-----:|:------:|:------:|--------|
| Abrir y cerrar el día (#34) | ✅ | ✅ | ❌ | RF-22: abre y cierra un cajero |
| Reabrir un día cerrado (#35) | ✅ | ❌ ⚠ | ❌ | RF-56: el administrador, valor de prueba (P-09) |
| Mover una orden a otra mesa (#38) | ✅ | ✅ | ✅ | RF-55: "el personal" |
| Listado de descuentos aplicados (#39) | ✅ | ❌ | ❌ | RF-49 |
| Tamaños de juego (#37) | ✅ | ❌ | ❌ | RF-57 (lectura: todos, para mostrar el precio) |
| `PUT /categorias/:id` (#56) | ✅ | ❌ | ❌ | RF-35 |
| `PUT /ordenes-juegos/:id` (#42) | ✅ | ✅ | ✅ | Igual que el resto de los ítems |
| Marcar un producto agotado (#53) | ✅ | ⚠ | ⚠ | Pendiente (P-12) |
| Reporte mensual de atrasos (#62) | ✅ | ❌ | ❌ | RF-45 |
| Operaciones por empleado (#47) | ✅ | ❌ | ❌ | RF-50 |

## Cómo se mantiene esta matriz

- Cada PR que agrega o cambia una ruta actualiza la fila correspondiente.
- Las pruebas automáticas de #25 recorren la matriz: por cada ruta, un rol permitido y uno no permitido.
- Cuando el dueño responda las filas marcadas con ⚠, se cambia el valor, se quita la marca y se anota en el historial.

## Historial

| Versión | Fecha | Cambio |
|---------|-------|--------|
| 0.1 | 25/11/2026 | Primera versión, a partir de las rutas de `main` (issue #9) |
