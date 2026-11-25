# ADR-008: Control de acceso por roles con permisos por acción (RBAC)

- **Estado:** Propuesto
- **Fecha:** 2026-11-25
- **Issue:** #10

## Contexto

- El sistema ya usa **control de acceso por roles** (RBAC, *Role-Based Access Control*): lo que puede hacer un usuario depende de su rol (ADMIN, CAJERO o MESERO). Pero los roles están **escritos en cada ruta**: `authorize(['ADMIN', 'CAJERO'])`. En algunos controladores, además, el rol se revisa a mano (`productoController`, anular pago).
- Varias decisiones de permisos siguen abiertas o pueden cambiar después de la entrega: quién borra una orden (P-21) y si el mesero también puede aprobar asistencias o anular pagos (RN-16, P-22).
- Con los roles escritos en cada ruta, cualquier cambio de permisos obliga a **modificar el código en varios archivos, probarlo e instalar de nuevo**. Después de la entrega, el dueño dependería de un desarrollador para algo que es una decisión del negocio.
- El backend va a tener dos clientes, la web y la app de meseros (ADR-005), que tienen que mostrar u ocultar acciones según lo que el usuario pueda hacer.
- Hoy el rol viaja dentro del token JWT. Si cambia el rol o los permisos de alguien, el cambio no se nota hasta que el token vence (#60).
- Marcelo (25/11/2026): le gustaría que el administrador pudiera cambiar los permisos de los roles si el dueño cambia de opinión, y **el administrador no debería poder quitarse permisos** (RN-17).

## Opciones consideradas

1. **Dejarlo como está:** listas de roles en cada ruta.
   - A favor: no hay que cambiar nada; es simple de leer.
   - En contra: cambiar un permiso es tocar varias rutas; los chequeos a mano se desordenan; la interfaz no tiene forma de saber qué puede hacer cada usuario.
2. **Permisos por acción con el mapa en código.** Cada ruta pide un permiso con nombre de acción del negocio (`requierePermiso('ordenes.cobrar')`) y un solo archivo dice qué permisos tiene cada rol.
   - A favor: la ruta dice *qué acción* protege, no *quién* la hace; cambiar los permisos de un rol es editar un solo lugar; el catálogo de permisos queda documentado y se puede probar ruta por ruta.
   - En contra: sigue haciendo falta un desarrollador para cambiar el mapa.
3. **Permisos por acción con el mapa en la base y una pantalla de administración.** Igual que la opción 2, pero el administrador edita los permisos de cada rol desde el panel.
   - A favor: el dueño cambia los permisos sin depender de nadie.
   - En contra: más trabajo (tablas, pantalla, pruebas, registro de cambios); hay que leer los permisos de la base en cada petición (o con una caché corta); hay riesgo de que el administrador se deje sin acceso si no se protege.
4. **Control por atributos (ABAC)** o roles creados por el usuario.
   - A favor: máxima flexibilidad (por ejemplo, "solo puede anular pagos de su propio turno").
   - En contra: mucho más complejo y ningún requisito lo pide para un café con tres roles.

## Decisión

Se elige **la opción 2 ahora y la opción 3 después**, si el dueño la confirma:

1. **Etapa 4 (#25):** las rutas pasan de `authorize([roles])` a **`requierePermiso('...')`**. El mapa rol → permisos vive en **un solo archivo del backend** y coincide con el catálogo de [`permisos.md`](../permisos.md). Se quitan los chequeos de rol hechos a mano en los controladores.
2. **Etapa 6 (#87), solo si el dueño responde que sí a P-22:** el mapa pasa a la base de datos y el administrador lo edita desde el panel. Antes del 10/12 no se hace.

**Reglas que acompañan la decisión:**

- **El ADMIN tiene siempre todos los permisos** (RN-17). No figura en el mapa: el código lo trata como superusuario, así que no se le puede quitar ninguno, ni siquiera él mismo, y cualquier permiso nuevo lo tiene automáticamente. El servidor rechaza cualquier intento de cambiarle permisos.
- **Los tres roles son fijos.** Solo se editan los permisos de CAJERO y MESERO; no se crean roles nuevos.
- **Los permisos son acciones del negocio** que el dueño entiende (`ordenes.cobrar`, `pagos.anular`, `asistencia.aprobar`), no endpoints. Un permiso puede cubrir varias rutas: `ordenes.cobrar` cubre `POST /ordenes/:id/finalizar` y `/pagos`. Nombres en minúscula, con el formato `area.accion`.
- **Los permisos se leen en el servidor en cada petición** (con una caché corta que se invalida cuando cambian), no desde el token. El token solo identifica al usuario. Un cambio de permisos, o un empleado desactivado, se aplica desde la siguiente petición (#60).
- **El login y el perfil devuelven los permisos del usuario**, para que la web y la app oculten las acciones que no puede usar. La protección real sigue siendo la del servidor.
- **Un permiso nuevo se agrega primero al catálogo** de `permisos.md` y después al código; las pruebas recorren la matriz ruta por ruta.

## Consecuencias

- **Positivas:**
  - Cambiar lo que puede hacer un rol es editar un mapa, sin tocar las rutas; después, con #87, ni siquiera hace falta un desarrollador.
  - El código se lee mejor: cada ruta dice qué acción protege.
  - El administrador no puede quedarse sin acceso.
  - La web y la app muestran solo lo que el usuario puede hacer.
  - Es un diseño habitual en sistemas reales y fácil de explicar en una entrevista, con un caso concreto (RN-16, P-21, P-22).
- **Negativas o riesgos:**
  - La #25 cambia más archivos que si solo se corrigieran las listas de roles.
  - Si se hace la pantalla (#87), hay que mantener tablas, una caché, un registro de cambios y más pruebas.
  - El catálogo de `permisos.md` y el mapa del código tienen que mantenerse iguales; si no, la documentación miente. Las pruebas automáticas de la matriz lo controlan.
- **Qué hay que hacer ahora:**
  - #25: implementar `requierePermiso`, el mapa en código y las pruebas que recorren la matriz.
  - #60: leer el usuario y sus permisos de la base en cada petición.
  - 10/12: preguntar P-22. Si el dueño dice que no, #87 se cierra como `no-se-hara` y el mapa sigue en código.

**Relacionado:** RF-52, RF-58, RN-16, RN-17 · [`permisos.md`](../permisos.md) · #25 · #60 · #87
