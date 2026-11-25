# Matriz de permisos por rol y endpoint

> **25/11/2026 · Versión 0.4** · Issues #9 y #25 · Requisitos RF-52, RF-58, RN-16 y RN-17 · ADR-008.
> Dice **qué puede hacer cada rol en cada endpoint** de la API (`/api/v1`). Es la especificación: las pruebas de `backend/tests/auth/` se generan desde este documento y fallan si el código no coincide (ver *Cómo se mantiene esta matriz*).

## Roles

| Rol | Quién es | Pantallas que usa hoy |
|-----|----------|-----------------------|
| `ADMIN` | El dueño o el encargado | `indexAdmin.html` (panel de administración) |
| `CAJERO` | Cobra, abre y cierra el día, confirma la asistencia | `index.html` (misma pantalla que el mesero) |
| `MESERO` | Toma pedidos, maneja mesas y reservas, y también cobra y abre el día | `index.html` |
| Público | Cliente del café, sin sesión | `catalogo.html` (catálogo de juegos por QR) |

Cocina y cafetería **no usan el sistema**: solo reciben la comanda impresa (P-10). No hay rol para ellas.

**Regla principal (RN-16, decisión de Marcelo del 25/11/2026):** el mesero y el cajero tienen **casi los mismos permisos**, porque cualquiera de los dos tiene que poder abrir el sistema y atender la caja si el otro se atrasa. Las únicas diferencias están en [*Diferencias entre CAJERO y MESERO*](#diferencias-entre-cajero-y-mesero).

## Cómo se protege una ruta

| Mecanismo | Dónde | Qué hace |
|-----------|-------|----------|
| `authenticate` | `middlewares/authMiddleware.js` | Exige un token JWT válido. Sin token, o con un token inválido o vencido, responde **401** (#26) |
| `requierePermiso('...')` | `middlewares/permisoMiddleware.js` | Exige que el rol del token tenga el permiso, según el mapa de `config/permisos.js`. Si no lo tiene, responde **403** con el permiso que faltó. Un permiso que no está en el catálogo detiene el arranque del servidor |

Desde #25 ya no hay `authorize([...])` (se borró `roleMiddleware.js`) ni revisiones de rol a mano en los controladores. La firma del supervisor que aprueba una asistencia también se revisa por permiso: quien firma tiene que tener `asistencia.aprobar`.

## Permisos por acción (RBAC)

Las rutas no se protegen por **rol**, sino por **permiso** (ADR-008): cada ruta pide una acción del negocio, por ejemplo `requierePermiso('ordenes.cobrar')`, y un mapa dice qué permisos tiene cada rol. Así, cambiar lo que puede hacer un rol es cambiar el mapa, sin tocar las rutas.

- **El ADMIN tiene siempre todos los permisos** (RN-17). No figura en el mapa: el código lo trata como superusuario. No se le puede quitar ningún permiso, ni siquiera él mismo, y cualquier permiso nuevo lo tiene automáticamente.
- **CAJERO y MESERO** tienen los permisos del mapa, que vive en **un solo archivo**: `backend/src/config/permisos.js` (#25). Un rol que no está en el mapa (por ejemplo, un `COCINERO` guardado antes de #109) no tiene ningún permiso. Si el dueño lo pide, el ADMIN podrá editarlo desde el panel de administración (#87, P-22).
- Dos rutas no piden permiso, solo una sesión iniciada (`GET /empleados/perfil` y `GET /configuracion`), y cuatro son públicas.
- El login y `GET /empleados/perfil` devuelven `permisos`: la lista de permisos del usuario, para que la interfaz sepa qué mostrar. Se calcula con el rol en cada petición (no va dentro del token), así que un cambio en el mapa se aplica sin volver a iniciar sesión.

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

La columna **Permiso** dice qué permiso pide la ruta (ver el catálogo): `🌐 público` (sin sesión), `solo sesión` (cualquier usuario con sesión) o el permiso que se pasa a `requierePermiso`. Las columnas de los roles salen del catálogo: un rol tiene ✅ en una ruta si tiene su permiso.

## Matriz

### Autenticación y empleados

| Método | Ruta | Permiso | ADMIN | CAJERO | MESERO | Notas |
|--------|------|---------|:-----:|:------:|:------:|-------|
| POST | `/auth/login` | 🌐 público | 🌐 | 🌐 | 🌐 | Falta límite de intentos (#69) |
| GET | `/empleados/perfil` | solo sesión | ✅ | ✅ | ✅ | Devuelve el contenido del token, no la BD (#60) |
| GET | `/empleados` | `asistencia.registrar` | ✅ | ✅ | ✅ | La usa la pantalla de asistencia (RN-16) |
| POST | `/empleados` | `empleados.gestionar` | ✅ | ❌ | ❌ | |
| PUT | `/empleados/:id` | `empleados.gestionar` | ✅ | ❌ | ❌ | |

### Catálogo (categorías, productos y juegos)

| Método | Ruta | Permiso | ADMIN | CAJERO | MESERO | Notas |
|--------|------|---------|:-----:|:------:|:------:|-------|
| GET | `/categorias` | 🌐 público | 🌐 | 🌐 | 🌐 | La usa el catálogo de clientes |
| POST | `/categorias` | `catalogo.gestionar` | ✅ | ❌ | ❌ | |
| DELETE | `/categorias/:id` | `catalogo.gestionar` | ✅ | ❌ | ❌ | |
| GET | `/productos` | `catalogo.ver` | ✅ | ✅ | ✅ | |
| GET | `/productos/:id` | `catalogo.ver` | ✅ | ✅ | ✅ | |
| POST | `/productos` | `catalogo.gestionar` | ✅ | ❌ | ❌ | Sin la revisión a mano del controlador desde #25 |
| PUT | `/productos/:id` | `catalogo.gestionar` | ✅ | ❌ | ❌ | Ídem |
| DELETE | `/productos/:id` | `catalogo.gestionar` | ✅ | ❌ | ❌ | Ídem |
| GET | `/juegos` | 🌐 público | 🌐 | 🌐 | 🌐 | Catálogo de clientes. Qué juegos mostrar: P-18 (#58) |
| GET | `/juegos/:id` | 🌐 público | 🌐 | 🌐 | 🌐 | |
| POST | `/juegos` | `catalogo.gestionar` | ✅ | ❌ | ❌ | |
| PUT | `/juegos/:id` | `catalogo.gestionar` | ✅ | ❌ | ❌ | |
| DELETE | `/juegos/:id` | `catalogo.gestionar` | ✅ | ❌ | ❌ | |

### Espacio (pisos y mesas)

| Método | Ruta | Permiso | ADMIN | CAJERO | MESERO | Notas |
|--------|------|---------|:-----:|:------:|:------:|-------|
| GET | `/pisos` | `espacio.ver` | ✅ | ✅ | ✅ | |
| POST | `/pisos` | `espacio.gestionar` | ✅ | ❌ | ❌ | |
| PUT | `/pisos/:id` | `espacio.gestionar` | ✅ | ❌ | ❌ | |
| DELETE | `/pisos/:id` | `espacio.gestionar` | ✅ | ❌ | ❌ | Validaciones faltantes (#48) |
| GET | `/mesas` | `espacio.ver` | ✅ | ✅ | ✅ | |
| POST | `/mesas` | `espacio.gestionar` | ✅ | ❌ | ❌ | |
| PUT | `/mesas/:id` | `espacio.gestionar` | ✅ | ❌ | ❌ | |
| DELETE | `/mesas/:id` | `espacio.gestionar` | ✅ | ❌ | ❌ | Validaciones faltantes (#48) |

### Órdenes, ítems y descuentos

| Método | Ruta | Permiso | ADMIN | CAJERO | MESERO | Notas |
|--------|------|---------|:-----:|:------:|:------:|-------|
| GET | `/ordenes` | `ordenes.ver` | ✅ | ✅ | ✅ | |
| GET | `/ordenes/:id` | `ordenes.ver` | ✅ | ✅ | ✅ | |
| POST | `/ordenes` | `ordenes.tomar` | ✅ | ✅ | ✅ | Con el día cerrado responde 409 (#34) |
| PUT | `/ordenes/:id` | `ordenes.tomar` | ✅ | ✅ | ✅ | Notas. No si la orden está cobrada (#41) |
| DELETE | `/ordenes/:id` | `ordenes.eliminar` | ✅ | ✅ | ✅ ⚠ | ⚠ Quién puede borrar o cancelar una orden con ítems ya enviados a cocina: pendiente (P-21, #44) |
| POST | `/ordenes/:id/finalizar` | `ordenes.cobrar` | ✅ | ✅ | ✅ | RF-17 y RN-16: cobran el cajero y el mesero |
| POST | `/ordenes/:id/descuento` | `ordenes.descontar` | ✅ | ✅ | ✅ | RN-06: cajero y mesero, sin tope. Motivo obligatorio (#39) |
| GET | `/ordenes/:id/descuentos` | `ordenes.ver` | ✅ | ✅ | ✅ | |
| DELETE | `/ordenes/:ordenId/descuento/:descuentoId` | `ordenes.descontar` | ✅ | ✅ | ✅ | |
| GET | `/ordenes-productos` | `ordenes.ver` | ✅ | ✅ | ✅ | |
| POST | `/ordenes-productos` | `ordenes.tomar` | ✅ | ✅ | ✅ | |
| PUT | `/ordenes-productos/:id` | `ordenes.tomar` | ✅ | ✅ | ✅ | Lista blanca de campos (#43) |
| DELETE | `/ordenes-productos/:id` | `ordenes.tomar` | ✅ | ✅ | ✅ | |
| GET | `/ordenes-juegos` | `ordenes.ver` | ✅ | ✅ | ✅ | |
| POST | `/ordenes-juegos` | `ordenes.tomar` | ✅ | ✅ | ✅ | |
| PATCH | `/ordenes-juegos/:id/terminar` | `ordenes.tomar` | ✅ | ✅ | ✅ | |
| DELETE | `/ordenes-juegos/:id` | `ordenes.tomar` | ✅ | ✅ | ✅ | Falta `PUT /ordenes-juegos/:id` (#42) |

### Pagos

| Método | Ruta | Permiso | ADMIN | CAJERO | MESERO | Notas |
|--------|------|---------|:-----:|:------:|:------:|-------|
| GET | `/pagos` | `ordenes.cobrar` | ✅ | ✅ | ✅ | RF-17 y RN-16 |
| POST | `/pagos` | `ordenes.cobrar` | ✅ | ✅ | ✅ | El frontend no usa esta ruta hoy; se unifica con `finalizar` en #36 |
| DELETE | `/pagos/:id` | `pagos.anular` | ✅ | ✅ | ❌ ⚠ | Anular un pago. ⚠ Diferencia que se mantiene por ahora; confirmar (ver abajo) |

### Clientes y reservas

| Método | Ruta | Permiso | ADMIN | CAJERO | MESERO | Notas |
|--------|------|---------|:-----:|:------:|:------:|-------|
| GET | `/clientes` | `clientes.gestionar` | ✅ | ✅ | ✅ | RN-03: las reservas siempre las registra el personal |
| POST | `/clientes` | `clientes.gestionar` | ✅ | ✅ | ✅ | |
| PUT | `/clientes/:id` | `clientes.gestionar` | ✅ | ✅ | ✅ | CI duplicado al editar (#64) |
| DELETE | `/clientes/:id` | `clientes.eliminar` | ✅ | ❌ | ❌ | |
| GET | `/reservas` | `reservas.gestionar` | ✅ | ✅ | ✅ | |
| GET | `/reservas/:id` | `reservas.gestionar` | ✅ | ✅ | ✅ | |
| POST | `/reservas` | `reservas.gestionar` | ✅ | ✅ | ✅ | |
| PUT | `/reservas/:id` | `reservas.gestionar` | ✅ | ✅ | ✅ | |
| DELETE | `/reservas/:id` | `reservas.gestionar` | ✅ | ✅ | ✅ | Tiene que cancelar, no borrar (#50) |

### Comandas

| Método | Ruta | Permiso | ADMIN | CAJERO | MESERO | Notas |
|--------|------|---------|:-----:|:------:|:------:|-------|
| GET | `/comandas` | `comandas.gestionar` | ✅ | ✅ | ✅ | Cocina y cafetería no entran al sistema: el personal imprime las comandas |
| POST | `/comandas/:id/avanzar` | `comandas.gestionar` | ✅ | ✅ | ✅ | |

### Asistencia

| Método | Ruta | Permiso | ADMIN | CAJERO | MESERO | Notas |
|--------|------|---------|:-----:|:------:|:------:|-------|
| GET | `/asistencias/hoy` | `asistencia.registrar` | ✅ | ✅ | ✅ | RN-16: si el cajero se atrasa, el mesero abre y registra las llegadas (#63) |
| POST | `/asistencias` | `asistencia.registrar` | ✅ | ✅ | ✅ | Se registra con el CI y la contraseña **del propio empleado** (RF-43, #30) |
| PUT | `/asistencias/:id/aprobar` | `asistencia.aprobar` | ✅ | ✅ ⚠ | ❌ | Además pide la firma (CI y contraseña) de un ADMIN o CAJERO. RN-10: el cajero confirma (valor de prueba) |
| DELETE | `/asistencias/:id` | `asistencia.aprobar` | ✅ | ✅ ⚠ | ❌ | Tiene que anular con firma, no borrar (#30) |

### Reportes, configuración e importación

| Método | Ruta | Permiso | ADMIN | CAJERO | MESERO | Notas |
|--------|------|---------|:-----:|:------:|:------:|-------|
| GET | `/reportes/dashboard` | `reportes.ver` | ✅ | ❌ | ❌ | RF-51 |
| GET | `/configuracion` | solo sesión | ✅ | ✅ | ✅ | La pantalla de reservas lee las ventanas de tiempo |
| GET | `/configuracion/descuentos-atraso` | `asistencia.registrar` | ✅ | ✅ | ✅ | Lo usa la pantalla de asistencia |
| PUT | `/configuracion` | `configuracion.editar` | ✅ | ✅ | ✅ | RN-16: el cajero y el mesero ajustan los tiempos de reserva desde su pantalla. **T2 deja de ser un bug.** Desde #25 valida los valores: enteros ≥ 0 y solo claves que existen (400) |
| POST | `/importacion/productos` | `importacion.usar` | ✅ | ❌ | ❌ | |
| POST | `/importacion/juegos` | `importacion.usar` | ✅ | ❌ | ❌ | |
| GET | `/importacion/plantillas/productos` | `importacion.usar` | ✅ | ❌ | ❌ | T17 |
| GET | `/importacion/plantillas/juegos` | `importacion.usar` | ✅ | ❌ | ❌ | T17 |

No existe `GET /reportes/cierre-dia`: la ruta que lo definía nunca estuvo montada en `app.js` (T15) y se eliminó en #15. El cierre del día se rehace en #34.

## Diferencias entre CAJERO y MESERO

Por RN-16 son pocas. Las dos quedan marcadas con ⚠ para confirmarlas con el dueño el 10/12 (P-22):

| Acción | CAJERO | MESERO | Motivo |
|--------|:------:|:------:|--------|
| Aprobar o anular una asistencia (`PUT /asistencias/:id/aprobar`, `DELETE /asistencias/:id`) | ✅ | ❌ | RN-10: la llegada la confirma otro usuario; valor de prueba, el cajero |
| Anular un pago (`DELETE /pagos/:id`) | ✅ | ❌ | Ya es así hoy; corrige dinero cobrado |

Lo que solo puede hacer el ADMIN (empleados, catálogo, mesas, dashboard, importación y reabrir el día) no cambia.

## Lo que cambió con #25

Antes de #25 las rutas se protegían por rol con `authorize([...])` y algunas no coincidían con esta matriz:

| # | Ruta | Antes | Desde #25 | Motivo |
|---|------|-------|-----------|--------|
| 1 | `GET /empleados` | ADMIN, CAJERO | los 3 roles (`asistencia.registrar`) | RN-16 (pantalla de asistencia) |
| 2 | `GET /asistencias/hoy` | ADMIN, CAJERO | los 3 roles | RN-16 |
| 3 | `POST /asistencias` | ADMIN, CAJERO | los 3 roles | RN-16 |
| 4 | `GET /importacion/plantillas/*` (2 rutas) | cualquier sesión | solo ADMIN (`importacion.usar`) | T17 |
| 5 | `DELETE /pagos/:id` | sesión + chequeo a mano | `pagos.anular` (ADMIN, CAJERO) | Mismo resultado, con el permiso |
| 6 | `POST`, `PUT`, `DELETE /productos` | ADMIN + chequeo a mano | `catalogo.gestionar` | Sin el chequeo duplicado |
| 7 | `PUT /configuracion` | guardaba cualquier valor | 400 con un valor que no es entero ≥ 0 o una clave que no existe | T2b |
| 8 | Rutas que pedían solo sesión | cualquier rol, también uno desconocido | solo los roles con el permiso | Un rol fuera del mapa no tiene permisos |

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
- Un permiso nuevo se agrega **primero aquí** (catálogo) y después en `backend/src/config/permisos.js`.
- Las pruebas se generan desde este documento (`backend/tests/auth/`):
  - `matrizPermisos.test.js`: por cada fila de la matriz, sin sesión responde 401 y cada rol pasa o recibe 403 según sus columnas.
  - `catalogoPermisos.test.js`: el catálogo y sus columnas CAJERO/MESERO son iguales al mapa del código; cada ruta montada declara **exactamente** el permiso de su fila (se leen los routers de Express), y las columnas de los roles de cada fila coinciden con el catálogo.
- Cuando el dueño responda las filas marcadas con ⚠, se cambia el valor, se quita la marca y se anota en el historial.

## Historial

| Versión | Fecha | Cambio |
|---------|-------|--------|
| 0.1 | 25/11/2026 | Primera versión, a partir de las rutas de `main` (issue #9) |
| 0.2 | 25/11/2026 | Decisión de Marcelo (RN-16): el mesero cobra, cambia la configuración, abre el día y registra asistencias. Quedan dos diferencias con el cajero |
| 0.3 | 25/11/2026 | Permisos por acción (ADR-008): catálogo de 20 permisos, columna *Permiso* en cada ruta y regla del ADMIN con todos los permisos (RN-17) |
| 0.4 | 25/11/2026 | #25: el código usa `requierePermiso` en todas las rutas y el mapa de `config/permisos.js`. Se quitan las columnas *Hoy* y *Dif.* (el código coincide con la matriz) y la tabla de diferencias pasa a *Lo que cambió con #25* |
