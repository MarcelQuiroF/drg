# ADR-002: Frontend en JavaScript vanilla con Vite, sin framework

- **Estado:** Propuesto
- **Fecha:** 2026-11-25
- **Issue:** #10

## Contexto

- El frontend es una **SPA casera** en HTML, CSS y JavaScript vanilla con módulos ES6: unas 3 850 líneas de JS en 13 módulos de `frontend/js/modules/`, 26 vistas parciales en `frontend/html/` y 18 hojas de estilo. `cargarHTML()` (`js/utils.js`) trae una vista con `fetch`, la inyecta con `innerHTML` en `#cuerpo` y llama a su función `init…()`. Express sirve todo como archivos estáticos.
- No hay paso de compilación: el navegador carga los archivos tal como están en el repo.
- Problemas que vienen de esa forma de trabajar:
  - Unas **60 asignaciones a `innerHTML`** arman HTML con datos de la API sin escapar, lo que deja un **XSS almacenado** (#23).
  - Las hojas de estilo se acumulan a medida que se navega y se pisan entre sí (cuatro `:root` distintos, #71).
  - **Dependencias desde CDN:** Chart.js (sin versión fijada, así que puede cambiar solo), Font Awesome, Boxicons y Google Fonts se descargan de internet en cada carga. El sistema se va a usar **en una PC del local** (RNF-01, ADR-003): si se corta internet, desaparecen los íconos, la fuente y los gráficos del dashboard.
  - El estado compartido vive en variables globales de cada módulo y en `sessionStorage`, y no hay tipos (ver ADR-001).
- La interfaz **ya fue aceptada** en semestres anteriores (mesas como tarjetas, flujo del mesero). Para el 10/12 hay que unificar la apariencia (#72), no rediseñar.
- Un solo desarrollador mantiene el proyecto. La app de meseros será un cliente aparte (ADR-005), así que la web no tiene que servir también para el celular como app.

## Opciones consideradas

1. **Dejarlo como está** (sin compilación, dependencias por CDN).
   - A favor: nada que aprender ni configurar.
   - En contra: no resuelve la dependencia de internet ni el orden de los estilos; no hay forma práctica de agregar TypeScript; cada `import` es una petición más.
2. **Vanilla + Vite** (y TypeScript módulo por módulo, según el ADR-001). Se conservan las vistas y los módulos; Vite agrega servidor de desarrollo, compilación y empaquetado.
   - A favor: el código actual funciona casi sin cambios (Vite entiende los módulos ES6 tal como están); las dependencias se instalan con `npm` con versión fija y se empaquetan **dentro** del sistema, sin internet; los CSS se pueden importar desde cada módulo; habilita TypeScript sin reescribir; recarga instantánea al desarrollar.
   - En contra: agrega un paso de compilación (`npm run build`) y una carpeta de salida que Express o Nginx tienen que servir; hay que ajustar las rutas relativas de las vistas.
3. **Reescribir con un framework** (React, Vue o Svelte).
   - A favor: componentes, estado y escape de HTML resueltos por el framework; muy valorado en el mercado laboral.
   - En contra: es reescribir toda la interfaz que el negocio ya aceptó, con un solo desarrollador; semanas sin poder entregar; las pantallas actuales y las pruebas manuales dejan de servir como referencia.
4. **HTML generado en el servidor** (plantillas en Express, o htmx).
   - A favor: menos JavaScript en el navegador; el escape de HTML lo hacen las plantillas.
   - En contra: cambia por completo la arquitectura actual (API JSON + SPA), que además necesita la app móvil; sería otra reescritura.

## Decisión

Se elige la **opción 2: JavaScript vanilla con Vite, sin framework**, y TypeScript módulo por módulo como dice el ADR-001.

- **Por qué sin framework:** el problema del frontend no es la falta de componentes, sino el orden (estilos, escape de HTML, dependencias). Eso se arregla sin reescribir una interfaz que el negocio ya aceptó. Un framework queda como mejora futura, y la API JSON lo permite cuando haga falta.
- **Por qué Vite:** es la herramienta estándar para compilar frontends modernos, funciona con módulos ES6 sin cambios y permite empaquetar todo para que el sistema **funcione sin internet** en el local.
- **Cuándo:** la configuración de Vite entra en la **Etapa 5**, después del 10/12, junto con TypeScript. Antes del 10/12 se hacen los arreglos que no dependen de Vite: el escape de HTML (#23) y el orden de los estilos y la apariencia (#71, #72). Los estilos se organizan desde ya en archivos que después se puedan importar desde los módulos (variables, base, componentes y vistas).
- **Reglas que acompañan la decisión:**
  - Toda vista que muestre datos de la API los inserta con `textContent` o con una función de escape (`utils.js`, #23). Nunca con `innerHTML` y datos crudos.
  - Las dependencias se instalan con `npm` y versión fija; nada se carga desde un CDN.
  - Un cliente de API único (`api.js`) con manejo común de 401 y 403 (#26, #63). En la Etapa 5 pasa a estar tipado.
  - El enrutamiento casero (`cargarHTML`) se mantiene. Si con Vite se vuelve incómodo, se evalúa en un ADR aparte.

## Consecuencias

- **Positivas:**
  - El sistema funciona aunque el local se quede sin internet.
  - Versiones fijas: Chart.js no cambia de un día para el otro.
  - TypeScript en el frontend sin reescribir (Etapa 5).
  - Archivos más chicos y en menos peticiones en producción.
  - Se conservan las pantallas que el negocio ya conoce.
- **Negativas o riesgos:**
  - Sin un framework, el escape de HTML depende de la disciplina: hay que revisarlo en cada PR (y, si se puede, con una regla de ESLint que avise del uso de `innerHTML`).
  - El código de las vistas sigue siendo más largo que con componentes.
  - Paso de compilación: el despliegue (ADR-003) tiene que construir el frontend y servir la carpeta de salida.
- **Qué hay que hacer ahora:**
  - Antes del 10/12: #23 (escape de HTML), #71 y #72 (estilos y apariencia) con esta organización en mente.
  - En la Etapa 5: crear las issues para configurar Vite, pasar las dependencias de CDN a `npm`, ajustar `cargarHTML` y las rutas, y migrar los módulos a TypeScript.

**Relacionado:** ADR-001 (TypeScript) · ADR-003 (despliegue local) · ADR-005 (cliente móvil) · #23 · #71 · #72
