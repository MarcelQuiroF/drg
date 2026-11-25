# ADR-005: Cliente móvil para meseros

- **Estado:** Propuesto
- **Fecha:** 2026-11-25
- **Issue:** #10

## Contexto

- Decisión del 25/11/2026: hay una **app para meseros**, hecha **desde cero**, sin usar como base ni como referencia la app Android original (cuyo código se perdió). Va en la **Etapa 6b**, después de que la API esté estable y tipada (Etapas 4, 6 y 5).
- Alcance mínimo (RUTA, Etapa 6b): iniciar sesión, ver mesas, abrir una orden, agregar productos y juegos, comentarios, mover la orden de mesa y enviar a cocina. **El cobro queda en la caja web.**
- RNF-08: la API sirve a dos clientes, la web y la app, con errores y códigos HTTP consistentes.
- El sistema corre en una **PC del local**, por HTTP dentro del WiFi, sin salida a internet (ADR-003). Los celulares tienen que encontrar la PC en la red (IP fija o nombre).
- **No se sabe todavía** si los meseros usarían su propio celular o uno del local, ni si son todos Android (P-13).
- Antes de la app, la web del mesero se hace usable en celular y tablet (#73). Eso ya cubre el uso básico desde un navegador.
- Después de la Etapa 5, el backend y la web están en **TypeScript**, con esquemas Zod para lo que entra a la API (ADR-001, ADR-002).
- El proyecto lo mantiene un solo desarrollador, y se va a mostrar en entrevistas.

## Opciones consideradas

1. **Solo la web responsive (#73), sin app.**
   - A favor: no hay nada nuevo que mantener; funciona en cualquier celular con navegador; no necesita instalación.
   - En contra: no se instala como app; la sesión y la experiencia dependen del navegador; no cumple la decisión de tener una app.
2. **PWA** (la web instalable como app).
   - A favor: reutiliza la web; una sola base de código.
   - En contra: el *service worker* que hace instalable una PWA **solo funciona con HTTPS** (o en `localhost`). En la red local, por HTTP, habría que crear un certificado propio e instalarlo en cada celular: engorroso y frágil. Además, se parece mucho a la opción 1.
3. **Android nativo con Kotlin + Jetpack Compose.**
   - A favor: la forma estándar de hacer apps Android; la mejor experiencia y rendimiento en Android; muy valorado para puestos de desarrollo Android.
   - En contra: solo Android (si algún mesero tiene iPhone, no le sirve); un segundo lenguaje y un segundo ecosistema (Gradle, Android Studio) para un solo desarrollador; no reutiliza los tipos ni los esquemas de TypeScript del backend; el desarrollo es el más largo.
4. **React Native con Expo y TypeScript.**
   - A favor: **el mismo lenguaje que el backend y la web** (TypeScript); puede reutilizar los tipos de la API y los esquemas Zod; una sola base de código para Android y, si hace falta, iPhone; Expo simplifica el desarrollo y la compilación del APK; también es muy usado en la industria.
   - En contra: una capa más entre el código y el sistema operativo; algo menos de rendimiento que nativo (no se nota en listas y formularios como estos); las actualizaciones de Expo y React Native piden mantenimiento.
5. **Flutter (Dart).**
   - A favor: multiplataforma, buen rendimiento, interfaz consistente.
   - En contra: un lenguaje nuevo (Dart) que no se usa en el resto del proyecto; no reutiliza nada de TypeScript.

Y sobre **dónde vive el código**:

- **Repo aparte (`drg-mobile`):** herramientas e historial separados, pero dos backlogs y dos lugares que mostrar.
- **Carpeta `mobile/` en este repo:** un solo backlog (ya existen la etiqueta `mobile` y el milestone "Etapa 6b"); un cambio en la API y su uso en la app pueden ir en el mismo PR; un solo enlace para el portafolio. Hay que filtrar el CI por carpeta.

## Decisión

Se propone la **opción 4: React Native con Expo y TypeScript**, en la carpeta **`mobile/`** de este mismo repo. La opción 1 (web responsive, #73) se hace igual antes, porque sirve mientras no exista la app y para cualquier dispositivo.

- **Por qué React Native y no Kotlin:**
  - Con un solo desarrollador, mantener **un solo lenguaje** en todo el sistema (TypeScript en el backend, la web y la app) reduce el trabajo y los errores.
  - Los tipos de la API y los esquemas Zod de la Etapa 5 se pueden **compartir** con la app, así que si la API cambia, la app no compila hasta que se adapte.
  - Cubre Android e iPhone mientras no se sepa qué celulares usan los meseros (P-13).
  - En una entrevista se puede mostrar un sistema completo *full-stack* en TypeScript, con un contrato de API compartido entre el servidor y sus dos clientes.
- **Por qué en `mobile/`:** el backlog, la API y la app evolucionan juntos, y se muestra un solo repo.
- **Si Marcelo prefiere Kotlin + Jetpack Compose** (por ejemplo, para orientarse a puestos de Android nativo), la opción 3 es válida: se cambia esta sección antes de aceptar el ADR y el resto (alcance, red, carpeta) se mantiene.
- **Detalles que acompañan la decisión:**
  - La dirección del servidor (IP o nombre de la PC) se configura en la app la primera vez.
  - Android bloquea por defecto el tráfico HTTP sin cifrar: la app tiene que permitirlo **solo** para la dirección del servidor local.
  - El token de sesión se guarda en el almacenamiento seguro del celular (`expo-secure-store`), no en texto plano.
  - Sin modo sin conexión en el MVP: si se pierde el WiFi, la app avisa con claridad y no guarda pedidos a medias.
  - La app se instala como APK en los celulares del local (sin pasar por Google Play).

## Consecuencias

- **Positivas:**
  - Un solo lenguaje y un contrato de API compartido entre servidor, web y app.
  - Funciona en Android y en iPhone.
  - Desarrollo más rápido que con nativo, que importa con un solo desarrollador.
- **Negativas o riesgos:**
  - Dependencia de Expo y React Native: hay que actualizarlos de vez en cuando.
  - Compartir tipos entre `backend/`, `frontend/` y `mobile/` necesita una pequeña carpeta común (por ejemplo `shared/`) y configuración de TypeScript.
  - Sin HTTPS, el tráfico viaja sin cifrar por el WiFi (ver ADR-003).
  - Instalar el APK a mano en cada celular; las actualizaciones también son a mano.
- **Qué hay que hacer ahora:**
  - Nada en código hasta la Etapa 6b.
  - Preguntar P-13 el 10/12 (celulares propios o del local, Android o iPhone).
  - Mientras tanto: #73 (web responsive) y una API estable (#26, #68, Etapa 5).
  - Al empezar la Etapa 6b, crear las issues del alcance mínimo en el milestone "Etapa 6b · App móvil".

**Relacionado:** RNF-03, RNF-08 · ADR-001 · ADR-002 · ADR-003 · #73
