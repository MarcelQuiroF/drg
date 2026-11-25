# Matriz de permisos por rol y endpoint

> **25/11/2026 · Versión 0.3** · Issue #9 · Requisitos RF-52, RF-58, RN-16 y RN-17 · ADR-008.
> Dice **qué puede hacer cada rol en cada endpoint** de la API (`/api/v1`) y lo compara con lo que hace hoy el código de `main`. La corrección en el código va en la issue #25.

## Roles

| Rol | Quién es | Pantallas que usa hoy |
|-----|----------|-----------------------|
| `ADMIN` | El dueño o el encargado | `indexAdmin.html` (panel de administración) |
| `CAJERO` | Cobra, abre y cierra el día, confirma la asistencia | `index.html` (misma pantalla que el mesero) |
| `MESERO` | Toma pedidos, maneja mesas y reservas, y también cobra y abre el día | `index.html` |
| Público | Cliente del café, sin sesión | `catalogo.html` (catálogo de juegos por QR) |

Cocina y cafetería **no usan el sistema**: solo reciben la comanda impresa (P-10). No hay rol para ellas.

**Regla principal (RN-16, decisión de Marcelo del 25/11/2026):** el mesero y el cajero tienen **casi los mismos permisos**, porque cualquiera de los dos tiene que poder abrir el sistema y atender la caja si el otro se atrasa. Las únicas diferencias están en [*Diferencias entre CAJERO y MESERO*](#diferencias-entre-cajero-y-mesero).

## Cómo se protege hoy una ruta

| Mecanismo | Dónde | Qué hace |
|-----------|-------|----------|
| `authenticate` | `middlewares/authMiddleware.js` | Exige un token JWT válido. Sin token, o con un token inválido o vencido, responde **401** (#26) |
| `authorize([...])` | `middlewares/roleMiddleware.js` | Exige que el rol del token esté en la lista. Si no está, responde 403 |
| Chequeo a mano | Algunos controladores | Revisan `req.empleado.rol` dentro de la función. Duplica o reemplaza a `authorize` (ver más abajo) |

## Permisos por acción (RBAC)

Las rutas no se protegen por **rol**, sino por **permiso** (ADR-008): cada ruta pide una acción del negocio, por ejemplo `requierePermiso('ordenes.cobrar')`, y un mapa dice qué permisos tiene cada rol. Así, cambiar lo que puede hacer un rol es cambiar el mapa, sin tocar las rutas.

- **El ADMIN tiene siempre todos los permisos** (RN-17). No figura en el mapa: el código lo trata como superusuario. No se le puede quitar ningún permiso, ni siquiera él mismo, y cualquier permiso nuevo lo tiene automáticamente.
- **CAJERO y MESERO** tienen los permisos del mapa. Hoy el mapa vive en un archivo del backend (#25). Si el dueño lo pide, el ADMIN podrá editarlo desde el panel de administración (#87, P-22).
- Dos rutas no piden permiso, solo una sesión iniciada (`GET /empleados/perfil` y `GET /configuracion`), y cuatro son públicas.

### Catálogo de permisos

| Permiso | Qué permite | CAJERO | MESERO |
|---------|-------------|:------:|:------:|
| `catalogo.ver` | Ver productos | ✅ | ✅ |
| `catalogo.gestionar` | Crear, editar y borrar productos, juegos y categorías | ❌ | ❌ |
| `espacio.ver` | Ver pisos y mesas | ✅ | ✅ |
| `espacio.gestionar` | Crear, editar y borrar pisos y mesas | ❌ | ❌ |
| `ordenes.ver` | Ver órdenes, sus ítems y sus descuentos | ✅ | ✅ |
| `ordenes.tomar` | Abrir órdenes, agregar, cambiar y quitar productos y juegos, editar notas | ✅ | ✅ |
| `ordenes.eliminar` | Borrar una orden | ✅ ⚠ | ✅ ⚠ |
| `ordenes.descontar` | Aplicar y quitar descuentos | ✅ | ✅ |
| `ordenes.cobrar` | Cobrar una orden y registrar pagos | ✅ | ✅ |
| `pagos.anular` | Anular un pago ya registrado | ✅ | ❌ ⚠ |
| `comandas.gestionar` | Ver las comandas y avanzar su estado | ✅ | ✅ |
| `clientes.gestionar` | Ver, crear y editar clientes | ✅ | ✅ |
| `clientes.eliminar` | Borrar clientes | ❌ | ❌ |
| `reservas.gestionar` | Ver, crear, editar y cancelar reservas | ✅ | ✅ |
| `asistencia.registrar` | Ver la asistencia del día y registrar llegadas | ✅ | ✅ |
| `asistencia.aprobar` | Aprobar o anular asistencias (con firma) | ✅ | ❌ ⚠ |
| `empleados.gestionar` | Crear y editar empleados y horarios | ❌ | ❌ |
| `reportes.ver` | Ver el dashboard | ❌ | ❌ |
| `configuracion.editar` | Cambiar los tiempos de reserva y otros valores | ✅ | ✅ |
| `importacion.usar` | Importar desde Excel y descargar las plantillas | ❌ | ❌ |

⚠ `ordenes.eliminar` está pendiente de P-21; `pagos.anular` y `asistencia.aprobar` son las dos diferencias entre cajero y mesero que hay que confirmar con el dueño (ver *Diferencias entre CAJERO y MESERO*).

**Permisos previstos** por el backlog (se agregan al catálogo cuando se implementen): `dia.abrir_cerrar` (CAJERO y MESERO, #34), `dia.reabrir` (solo ADMIN, #35), `descuentos.controlar` (solo ADMIN, #39), `productos.disponibilidad` (pendiente de P-12, #53) y `permisos.gestionar` (solo ADMIN, fijo, #87).

## Leyenda

| Símbolo | Significado |
|:-------:|-------------|
| ✅ | El rol puede usar el endpoint |
| ❌ | El servidor tiene que responder 403 |
| 🌐 | Público: no hace falta sesión |
| ⚠ | Valor de prueba o pendiente de confirmar con el dueño; se usa mientras tanto |

La columna **Permiso** dice qué permiso pide la ruta (ver el catálogo). La columna **Hoy** dice qué protección tiene la ruta en el código: `público`, `sesión` (solo `authenticate`, o sea cualquier rol), o la lista de roles de `authorize`. La columna **Dif.** marca con **≠** las filas donde el código no coincide con la matriz; esas son las que corrige #25.

## Matriz

### Autenticación y empleados

| Método | Ruta | Permiso | ADMIN | CAJERO | MESERO | Hoy | Dif. | Notas |
|--------|------|---------|:-----:|:------:|:------:|-----|:----:|-------|
| POST | `/auth/login` | 🌐 público | 🌐 | 🌐 | 🌐 | público | | Falta límite de intentos (#69) |
| GET | `/empleados/perfil` | solo sesión | ✅ | ✅ | ✅ | sesión | | Devuelve el contenido del token, no la BD (#60) |
| GET | `/empleados` | `asistencia.registrar` | ✅ | ✅ | ✅ | ADMIN, CAJERO | ≠ | La usa la pantalla de asistencia (RN-16) |
| POST | `/empleados` | `empleados.gestionar` | ✅ | ❌ | ❌ | ADMIN | | |
| PUT | `/empleados/:id` | `empleados.gestionar` | ✅ | ❌ | ❌ | ADMIN | | |

### Catálogo (categorías, productos y juegos)

| Método | Ruta | Permiso | ADMIN | CAJERO | MESERO | Hoy | Dif. | Notas |
|--------|------|---------|:-----:|:------:|:------:|-----|:----:|-------|
| GET | `/categorias` | 🌐 público | 🌐 | 🌐 | 🌐 | público | | La usa el catálogo de clientes |
| POST | `/categorias` | `catalogo.gestionar` | ✅ | ❌ | ❌ | ADMIN | | |
| DELETE | `/categorias/:id` | `catalogo.gestionar` | ✅ | ❌ | ❌ | ADMIN | | |
| GET | `/productos` | `catalogo.ver` | ✅ | ✅ | ✅ | sesión | | |
| GET | `/productos/:id` | `catalogo.ver` | ✅ | ✅ | ✅ | sesión | | |
| POST | `/productos` | `catalogo.gestionar` | ✅ | ❌ | ❌ | ADMIN + chequeo a mano | ≠ | Quitar el chequeo duplicado del controlador |
| PUT | `/productos/:id` | `catalogo.gestionar` | ✅ | ❌ | ❌ | ADMIN + chequeo a mano | ≠ | Ídem |
| DELETE | `/productos/:id` | `catalogo.gestionar` | ✅ | ❌ | ❌ | ADMIN + chequeo a mano | ≠ | Ídem |
| GET | `/juegos` | 🌐 público | 🌐 | 🌐 | 🌐 | público | | Catálogo de clientes. Qué juegos mostrar: P-18 (#58) |
| GET | `/juegos/:id` | 🌐 público | 🌐 | 🌐 | 🌐 | público | | |
| POST | `/juegos` | `catalogo.gestionar` | ✅ | ❌ | ❌ | ADMIN | | |
| PUT | `/juegos/:id` | `catalogo.gestionar` | ✅ | ❌ | ❌ | ADMIN | | |
| DELETE | `/juegos/:id` | `catalogo.gestionar` | ✅ | ❌ | ❌ | ADMIN | | |

### Espacio (pisos y mesas)

| Método | Ruta | Permiso | ADMIN | CAJERO | MESERO | Hoy | Dif. | Notas |
|--------|------|---------|:-----:|:------:|:------:|-----|:----:|-------|
| GET | `/pisos` | `espacio.ver` | ✅ | ✅ | ✅ | sesión | | |
| POST | `/pisos` | `espacio.gestionar` | ✅ | ❌ | ❌ | ADMIN | | |
| PUT | `/pisos/:id` | `espacio.gestionar` | ✅ | ❌ | ❌ | ADMIN | | |
| DELETE | `/pisos/:id` | `espacio.gestionar` | ✅ | ❌ | ❌ | ADMIN | | Validaciones faltantes (#48) |
| GET | `/mesas` | `espacio.ver` | ✅ | ✅ | ✅ | sesión | | |
| POST | `/mesas` | `espacio.gestionar` | ✅ | ❌ | ❌ | ADMIN | | |
| PUT | `/mesas/:id` | `espacio.gestionar` | ✅ | ❌ | ❌ | ADMIN | | |
| DELETE | `/mesas/:id` | `espacio.gestionar` | ✅ | ❌ | ❌ | ADMIN | | Validaciones faltantes (#48) |

### Órdenes, ítems y descuentos

| Método | Ruta | Permiso | ADMIN | CAJERO | MESERO | Hoy | Dif. | Notas |
|--------|------|---------|:-----:|:------:|:------:|-----|:----:|-------|
| GET | `/ordenes` | `ordenes.ver` | ✅ | ✅ | ✅ | sesión | | |
| GET | `/ordenes/:id` | `ordenes.ver` | ✅ | ✅ | ✅ | sesión | | |
| POST | `/ordenes` | `ordenes.tomar` | ✅ | ✅ | ✅ | sesión | | Con el día cerrado responde 409 (#34) |
| PUT | `/ordenes/:id` | `ordenes.tomar` | ✅ | ✅ | ✅ | los 3 roles | | Notas. No si la orden está cobrada (#41) |
| DELETE | `/ordenes/:id` | `ordenes.eliminar` | ✅ | ✅ | ✅ ⚠ | los 3 roles | | ⚠ Quién puede borrar o cancelar una orden con ítems ya enviados a cocina: pendiente (P-21, #44) |
| POST | `/ordenes/:id/finalizar` | `ordenes.cobrar` | ✅ | ✅ | ✅ | los 3 roles | | RF-17 y RN-16: cobran el cajero y el mesero |
| POST | `/ordenes/:id/descuento` | `ordenes.descontar` | ✅ | ✅ | ✅ | los 3 roles | | RN-06: cajero y mesero, sin tope. Motivo obligatorio (#39) |
| GET | `/ordenes/:id/descuentos` | `ordenes.ver` | ✅ | ✅ | ✅ | los 3 roles | | |
| DELETE | `/ordenes/:ordenId/descuento/:descuentoId` | `ordenes.descontar` | ✅ | ✅ | ✅ | los 3 roles | | |
| GET | `/ordenes-productos` | `ordenes.ver` | ✅ | ✅ | ✅ | sesión | | |
| POST | `/ordenes-productos` | `ordenes.tomar` | ✅ | ✅ | ✅ | sesión | | |
| PUT | `/ordenes-productos/:id` | `ordenes.tomar` | ✅ | ✅ | ✅ | sesión | | Lista blanca de campos (#43) |
| DELETE | `/ordenes-productos/:id` | `ordenes.tomar` | ✅ | ✅ | ✅ | sesión | | |
| GET | `/ordenes-juegos` | `ordenes.ver` | ✅ | ✅ | ✅ | sesión | | |
| POST | `/ordenes-juegos` | `ordenes.tomar` | ✅ | ✅ | ✅ | sesión | | |
| PATCH | `/ordenes-juegos/:id/terminar` | `ordenes.tomar` | ✅ | ✅ | ✅ | sesión | | |
| DELETE | `/ordenes-juegos/:id` | `ordenes.tomar` | ✅ | ✅ | ✅ | sesión | | Falta `PUT /ordenes-juegos/:id` (#42) |

### Pagos

| Método | Ruta | Permiso | ADMIN | CAJERO | MESERO | Hoy | Dif. | Notas |
|--------|------|---------|:-----:|:------:|:------:|-----|:----:|-------|
| GET | `/pagos` | `ordenes.cobrar` | ✅ | ✅ | ✅ | sesión | | RF-17 y RN-16 |
| POST | `/pagos` | `ordenes.cobrar` | ✅ | ✅ | ✅ | sesión | | El frontend no usa esta ruta hoy; se unifica con `finalizar` en #36 |
| DELETE | `/pagos/:id` | `pagos.anular` | ✅ | ✅ | ❌ ⚠ | sesión + chequeo a mano | ≠ | Anular un pago. Hoy el controlador rechaza al mesero a mano: pasar a `authorize`. ⚠ Diferencia que se mantiene por ahora; confirmar (ver abajo) |

### Clientes y reservas

| Método | Ruta | Permiso | ADMIN | CAJERO | MESERO | Hoy | Dif. | Notas |
|--------|------|---------|:-----:|:------:|:------:|-----|:----:|-------|
| GET | `/clientes` | `clientes.gestionar` | ✅ | ✅ | ✅ | sesión | | RN-03: las reservas siempre las registra el personal |
| POST | `/clientes` | `clientes.gestionar` | ✅ | ✅ | ✅ | sesión | | |
| PUT | `/clientes/:id` | `clientes.gestionar` | ✅ | ✅ | ✅ | sesión | | CI duplicado al editar (#64) |
| DELETE | `/clientes/:id` | `clientes.eliminar` | ✅ | ❌ | ❌ | ADMIN | | |
| GET | `/reservas` | `reservas.gestionar` | ✅ | ✅ | ✅ | sesión | | |
| GET | `/reservas/:id` | `reservas.gestionar` | ✅ | ✅ | ✅ | sesión | | |
| POST | `/reservas` | `reservas.gestionar` | ✅ | ✅ | ✅ | sesión | | |
| PUT | `/reservas/:id` | `reservas.gestionar` | ✅ | ✅ | ✅ | sesión | | |
| DELETE | `/reservas/:id` | `reservas.gestionar` | ✅ | ✅ | ✅ | sesión | | Tiene que cancelar, no borrar (#50) |

### Comandas

| Método | Ruta | Permiso | ADMIN | CAJERO | MESERO | Hoy | Dif. | Notas |
|--------|------|---------|:-----:|:------:|:------:|-----|:----:|-------|
| GET | `/comandas` | `comandas.gestionar` | ✅ | ✅ | ✅ | sesión | | Cocina y cafetería no entran al sistema: el personal imprime las comandas |
| POST | `/comandas/:id/avanzar` | `comandas.gestionar` | ✅ | ✅ | ✅ | sesión | | |

### Asistencia

| Método | Ruta | Permiso | ADMIN | CAJERO | MESERO | Hoy | Dif. | Notas |
|--------|------|---------|:-----:|:------:|:------:|-----|:----:|-------|
| GET | `/asistencias/hoy` | `asistencia.registrar` | ✅ | ✅ | ✅ | ADMIN, CAJERO | ≠ | RN-16: si el cajero se atrasa, el mesero abre y registra las llegadas (#63) |
| POST | `/asistencias` | `asistencia.registrar` | ✅ | ✅ | ✅ | ADMIN, CAJERO | ≠ | Se registra con el CI y la contraseña **del propio empleado** (RF-43, #30) |
| PUT | `/asistencias/:id/aprobar` | `asistencia.aprobar` | ✅ | ✅ ⚠ | ❌ | ADMIN, CAJERO | | Además pide la firma (CI y contraseña) de un ADMIN o CAJERO. RN-10: el cajero confirma (valor de prueba) |
| DELETE | `/asistencias/:id` | `asistencia.aprobar` | ✅ | ✅ ⚠ | ❌ | ADMIN, CAJERO | | Tiene que anular con firma, no borrar (#30) |

### Reportes, configuración e importación

| Método | Ruta | Permiso | ADMIN | CAJERO | MESERO | Hoy | Dif. | Notas |
|--------|------|---------|:-----:|:------:|:------:|-----|:----:|-------|
| GET | `/reportes/dashboard` | `reportes.ver` | ✅ | ❌ | ❌ | ADMIN | | RF-51 |
| GET | `/configuracion` | solo sesión | ✅ | ✅ | ✅ | sesión | | La pantalla de reservas lee las ventanas de tiempo |
| GET | `/configuracion/descuentos-atraso` | `asistencia.registrar` | ✅ | ✅ | ✅ | sesión | | Lo usa la pantalla de asistencia |
| PUT | `/configuracion` | `configuracion.editar` | ✅ | ✅ | ✅ | sesión | | RN-16: el cajero y el mesero ajustan los tiempos de reserva desde su pantalla. **T2 deja de ser un bug.** Falta validar los valores (por ejemplo, que no sean negativos) en #25 |
| POST | `/importacion/productos` | `importacion.usar` | ✅ | ❌ | ❌ | ADMIN | | |
| POST | `/importacion/juegos` | `importacion.usar` | ✅ | ❌ | ❌ | ADMIN | | |
| GET | `/importacion/plantillas/productos` | `importacion.usar` | ✅ | ❌ | ❌ | sesión | ≠ | T17 |
| GET | `/importacion/plantillas/juegos` | `importacion.usar` | ✅ | ❌ | ❌ | sesión | ≠ | T17 |

No existe `GET /reportes/cierre-dia`: la ruta que lo definía nunca estuvo montada en `app.js` (T15) y se eliminó en #15. El cierre del día se rehace en #34.

## Diferencias entre CAJERO y MESERO

Por RN-16 son pocas. Las dos quedan marcadas con ⚠ para confirmarlas con el dueño el 10/12 (P-22):

| Acción | CAJERO | MESERO | Motivo |
|--------|:------:|:------:|--------|
| Aprobar o anular una asistencia (`PUT /asistencias/:id/aprobar`, `DELETE /asistencias/:id`) | ✅ | ❌ | RN-10: la llegada la confirma otro usuario; valor de prueba, el cajero |
| Anular un pago (`DELETE /pagos/:id`) | ✅ | ❌ | Ya es así hoy; corrige dinero cobrado |

Lo que solo puede hacer el ADMIN (empleados, catálogo, mesas, dashboard, importación y reabrir el día) no cambia.

## Resumen de diferencias con el código (lo que corrige #25)

| # | Ruta | Hoy | Debería | Motivo |
|---|------|-----|---------|--------|
| 1 | `GET /empleados` | ADMIN, CAJERO | los 3 roles | RN-16 (pantalla de asistencia) |
| 2 | `GET /asistencias/hoy` | ADMIN, CAJERO | los 3 roles | RN-16 |
| 3 | `POST /asistencias` | ADMIN, CAJERO | los 3 roles | RN-16 |
| 4 | `GET /importacion/plantillas/*` (2 rutas) | sesión | ADMIN | T17 |
| 5 | `DELETE /pagos/:id` | sesión + chequeo a mano | ADMIN, CAJERO | Mismo permiso, pero con `authorize` |
| 6 | `POST`, `PUT`, `DELETE /productos` | ADMIN + chequeo a mano | ADMIN | Quitar el chequeo duplicado |

De las **69 rutas** montadas, **6** cambian de protección (3 se abren al mesero, 2 se cierran a quien no es ADMIN y 1 pasa el chequeo a `authorize`) y **3** solo pierden el chequeo duplicado. Las otras 60 ya coinciden con la matriz.

## Efectos en el frontend

- **Menú de asistencia:** se muestra a los 3 roles; los botones de aprobar y anular, solo a ADMIN y CAJERO (#63).
- **Anular un pago:** el botón se oculta para el MESERO.
- **Mensajes:** un 403 se muestra como error de permisos, no como lista vacía (#63); un 401 vuelve al login (#26).
- El rol guardado en `localStorage` sirve solo para la interfaz. La protección real es la del servidor.

## Endpoints nuevos previstos en el backlog

| Endpoint (nombre tentativo) | Permiso | ADMIN | CAJERO | MESERO | Fuente |
|-----------------------------|---------|:-----:|:------:|:------:|--------|
| Abrir y cerrar el día (#34) | `dia.abrir_cerrar` | ✅ | ✅ | ✅ | RF-22 y RN-16: el cajero o el mesero |
| Reabrir un día cerrado (#35) | `dia.reabrir` | ✅ | ❌ ⚠ | ❌ | RF-56: el administrador, valor de prueba (P-09) |
| Mover una orden a otra mesa (#38) | `ordenes.tomar` | ✅ | ✅ | ✅ | RF-55: "el personal" |
| Listado de descuentos aplicados (#39) | `descuentos.controlar` | ✅ | ❌ | ❌ | RF-49 |
| Tamaños de juego (#37) | `catalogo.gestionar` | ✅ | ❌ | ❌ | RF-57 (lectura: todos, para mostrar el precio) |
| `PUT /categorias/:id` (#56) | `catalogo.gestionar` | ✅ | ❌ | ❌ | RF-35 |
| `PUT /ordenes-juegos/:id` (#42) | `ordenes.tomar` | ✅ | ✅ | ✅ | Igual que el resto de los ítems |
| Marcar un producto agotado (#53) | `productos.disponibilidad` | ✅ | ⚠ | ⚠ | Pendiente (P-12) |
| Reporte mensual de atrasos (#62) | `reportes.ver` | ✅ | ❌ | ❌ | RF-45 |
| Operaciones por empleado (#47) | `reportes.ver` | ✅ | ❌ | ❌ | RF-50 |

## Cómo se mantiene esta matriz

- Cada PR que agrega o cambia una ruta actualiza la fila correspondiente, con su permiso.
- El mapa de permisos del backend (#25) y el catálogo de este documento tienen que coincidir. Un permiso nuevo se agrega primero aquí.
- Las pruebas automáticas de #25 recorren la matriz: por cada ruta, un rol con el permiso y uno sin él.
- Cuando el dueño responda las filas marcadas con ⚠, se cambia el valor, se quita la marca y se anota en el historial.

## Historial

| Versión | Fecha | Cambio |
|---------|-------|--------|
| 0.1 | 25/11/2026 | Primera versión, a partir de las rutas de `main` (issue #9) |
| 0.2 | 25/11/2026 | Decisión de Marcelo (RN-16): el mesero cobra, cambia la configuración, abre el día y registra asistencias. Quedan dos diferencias con el cajero |
| 0.3 | 25/11/2026 | Permisos por acción (ADR-008): catálogo de 20 permisos, columna *Permiso* en cada ruta y regla del ADMIN con todos los permisos (RN-17) |
