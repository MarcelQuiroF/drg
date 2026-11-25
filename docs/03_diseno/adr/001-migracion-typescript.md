# ADR-001: Migración gradual del backend a TypeScript

- **Estado:** Propuesto
- **Fecha:** 2026-11-25
- **Issue:** #10

## Contexto

- El backend está en **JavaScript (CommonJS)**: Node.js + Express 5 + Sequelize 6 + PostgreSQL, unas 4 100 líneas en `backend/src` sin contar migraciones ni seeders (24 modelos, 19 archivos de rutas, 19 controladores y 16 servicios). El frontend tiene unas 3 850 líneas de JavaScript vanilla; su camino se decide en el ADR-002.
- Muchos de los bugs encontrados en el análisis son **errores de forma**, de los que un compilador avisa antes de ejecutar:
  - `juego.setCategorias is not a function` (#24): el método generado se llama `setCategoria`.
  - Campos que no coinciden entre modelos y BD, como `direccion` en `Empleado` (#28).
  - `ordenController.finalizar` llama al servicio sin el argumento `pagos` (#21).
  - `crearOrden` está definida dos veces en el mismo archivo y la segunda pisa a la primera (#15).
  - `mesaId` (string) se compara con `mesa_id` (número) usando `!==` (#50).
- El backend va a tener **dos clientes**, la web y la app móvil de meseros (RNF-08). Los dos dependen de que la forma de la API (lo que recibe y lo que responde) sea estable y esté documentada.
- **Hoy no hay pruebas automáticas.** Las agrega la Etapa 3 (#18).
- **El alcance todavía no está validado** con el dueño. Se presenta el MVP el **10/12/2026**, y hasta entonces se trabaja con valores de prueba que pueden cambiar.
- El proyecto se va a mostrar en entrevistas de trabajo. TypeScript es hoy lo habitual en proyectos Node profesionales.

## Opciones consideradas

1. **Seguir en JavaScript sin cambios.**
   - A favor: no cuesta nada ahora; no agrega un paso de compilación.
   - En contra: los errores de forma se siguen encontrando en producción o a mano. Con dos clientes, cualquier cambio en la API es más riesgoso.
2. **JavaScript con anotaciones JSDoc y `checkJs`.** El compilador de TypeScript revisa los `.js` usando comentarios `/** @type … */`.
   - A favor: sin paso de compilación; se puede empezar archivo por archivo.
   - En contra: los tipos de Sequelize y de Express quedan muy verbosos en JSDoc. Es menos claro de leer y menos común en el mercado laboral. Termina siendo un TypeScript a medias.
3. **Migración gradual a TypeScript** con `allowJs`: el backend compila con archivos `.js` y `.ts` mezclados, y se pasa **módulo por módulo** a `.ts`, cada uno en su PR y con sus pruebas.
   - A favor: el sistema funciona igual en cada paso; cada PR es chico y reversible; los módulos con más bugs (órdenes, pagos) se tipan primero; se puede sumar validación con **Zod** al mismo tiempo.
   - En contra: durante la migración conviven los dos lenguajes; agrega un paso de compilación (`tsc`) y una carpeta de salida.
4. **Reescribir el backend completo en TypeScript** (incluso con otro framework, como NestJS).
   - A favor: código uniforme desde el principio.
   - En contra: semanas sin poder entregar nada; tira el código que funciona; con un solo desarrollador y sin pruebas es la opción con más riesgo de romper cosas.

## Decisión

Se elige la **opción 3: migración gradual del backend a TypeScript**, **después de la presentación del MVP (10/12/2026)** y **después de tener las pruebas de la Etapa 3**.

- **Por qué gradual:** permite seguir entregando y cada paso se puede revisar y revertir. Es como se migran los sistemas reales que ya están en uso.
- **Por qué después del 10/12:**
  - Lo que el dueño va a ver son las funcionalidades y la apariencia; TypeScript no cambia nada visible.
  - Tipar un módulo cuyo alcance todavía puede cambiar es trabajo doble.
  - Sin pruebas no hay forma de comprobar que la migración no rompió nada. Las Etapas 3, 4 y 6 dejan esa red de seguridad.
- **Cómo:**
  1. **Configuración:** `typescript`, `tsconfig.json` con `allowJs`, `strict: true` para los archivos `.ts`, salida a `backend/dist/`, y `npm run typecheck` en el CI. En desarrollo se ejecuta con `tsx` (sin compilar a mano); en producción, el código compilado de `dist/`.
  2. **Modelos y tipos compartidos:** se definen los modelos de Sequelize con sus tipos (`InferAttributes` / `InferCreationAttributes`) y los tipos comunes (roles, estados de mesa, reserva y comanda como uniones de texto en lugar de números mágicos).
  3. **Servicios y controladores, módulo por módulo:** órdenes y pagos → reservas → asistencia → resto. En cada módulo se agrega un esquema **Zod** para validar lo que llega en el `body` y la `query`; los tipos de entrada salen del propio esquema (`z.infer`), así que la validación y el tipo no pueden quedar desalineados.
  4. **Frontend:** según el ADR-002 (Vite + TypeScript, con un cliente de API tipado).
- **Qué no se migra:** las migraciones y los seeders de `sequelize-cli` se quedan en JavaScript. Se ejecutan una sola vez, no forman parte de la lógica del negocio y `sequelize-cli` no corre TypeScript sin configuración extra.
- **No cambian** Express, Sequelize ni PostgreSQL. Cambiar de ORM (por ejemplo, a Prisma o Drizzle) sería otra reescritura y necesita su propio ADR con una razón concreta.

## Consecuencias

- **Positivas:**
  - El compilador detecta antes de ejecutar errores como los de #21, #24 y #28.
  - Con Zod, los datos inválidos se rechazan con un 400 claro en la entrada de la API, en lugar de terminar en un 500 de la base de datos.
  - Autocompletado y navegación del código en el editor; es más fácil retomar el proyecto después de meses.
  - Los tipos de las respuestas sirven de base para el cliente web, la app móvil y una documentación OpenAPI más adelante.
  - Es una migración real y documentada para mostrar en entrevistas: por qué, en qué orden y cómo se evitó romper el sistema.
- **Negativas o riesgos:**
  - Paso de compilación: el despliegue (Docker, Etapa 7) tiene que construir `dist/`; los errores en producción necesitan *source maps* para apuntar al `.ts`.
  - Los tipos de Sequelize 6 son verbosos, sobre todo en las asociaciones (`include`) y en los métodos generados.
  - Mientras dure la migración conviven `.js` y `.ts`; hay que evitar que queden módulos a medias mucho tiempo.
  - Curva de aprendizaje: `strict` va a marcar muchos casos de `null`/`undefined` que hoy pasan sin aviso. Es justamente lo que se busca, pero lleva tiempo.
- **Qué hay que hacer ahora:**
  - Nada en el código hasta después del 10/12.
  - Al empezar la Etapa 5, crear una issue por bloque (configuración, modelos y un módulo por issue) en el milestone "Etapa 5 · TypeScript".
  - Mientras tanto, el código nuevo de las Etapas 4 y 6 se escribe pensando en la migración: funciones chicas, sin modificar objetos que llegan por parámetro y con listas blancas de campos en lugar de `update(req.body)`.
  - Actualizar `docs/03_diseno/arquitectura.md` (#11) cuando termine la migración.

**Relacionado:** ADR-002 (frontend) · #18 (pruebas) · #68 (errores consistentes) · RNF-08
