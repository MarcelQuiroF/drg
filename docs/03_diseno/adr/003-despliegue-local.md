# ADR-003: Despliegue en la PC local del café con Docker Compose

- **Estado:** Aceptado (25/11/2026, aprobado por Marcelo)
- **Fecha:** 2026-11-25
- **Issue:** #10

## Contexto

- Decisión del 24/11/2026 (RNF-01): para la entrega, el sistema funciona **en una PC del local** y el personal entra desde sus dispositivos por el **WiFi del local**. La nube se evalúa después, en la Etapa 9.
- RNF-02: el sistema tiene que estar disponible durante todo el horario de atención y **volver a arrancar solo** si la PC se reinicia.
- El sistema son tres piezas: el backend (Node.js + Express, que hoy también sirve el frontend), la base PostgreSQL y, más adelante, el frontend compilado por Vite (ADR-002). La app de meseros (ADR-005) también se conecta al backend por la red local.
- En el repo ya hay lugar previsto para Docker y Nginx, pero los archivos están vacíos: `backend/docker-compose.yml` solo tiene un comentario y `nginx/default.conf` no tiene nada.
- **No se conoce todavía la PC** (P-13): sistema operativo, memoria, si queda encendida todo el día y si se usa para otras cosas (por ejemplo, transmisiones en vivo). Tampoco el router ni el WiFi.
- Quien mantenga el sistema después de la entrega tiene que poder reinstalarlo siguiendo una guía (RNF-10).

## Opciones consideradas

1. **Instalación nativa:** Node.js y PostgreSQL instalados directamente en la PC; el backend corre como servicio (por ejemplo con `pm2`, o como servicio de Windows).
   - A favor: consume menos memoria; funciona en PCs viejas; no hace falta virtualización.
   - En contra: la instalación depende del sistema operativo y de las versiones instaladas; es más difícil de repetir igual en otra PC; actualizar Node o PostgreSQL puede romper cosas; hay que documentar muchos pasos a mano.
2. **Docker Compose en la PC del local:** backend, PostgreSQL y Nginx en contenedores, definidos en un solo archivo, con reinicio automático (`restart: unless-stopped`) y la base en un volumen persistente.
   - A favor: la misma configuración en desarrollo, en las pruebas y en el local; se instala con pocos comandos; las versiones quedan fijas en el archivo; los respaldos (ADR-004) se programan sobre el contenedor de la base; es lo que se usa en la industria y suma al portafolio.
   - En contra: en Windows necesita Docker Desktop con WSL2, virtualización activada y más memoria; si la PC es vieja o se usa para transmitir en vivo, los contenedores compiten por recursos.
3. **Subirlo a la nube ya** (VPS u hosting administrado).
   - A favor: acceso desde fuera del local, HTTPS fácil, respaldos administrados.
   - En contra: el local depende de internet para cobrar; tiene un costo mensual que el dueño no aprobó; es justamente lo que evalúa la Etapa 9.
4. **Un equipo dedicado** (mini-PC o laptop vieja con Linux) solo para el sistema.
   - A favor: no compite con otros usos de la PC; Linux corre Docker sin capas extra.
   - En contra: hay que comprarlo o conseguirlo; es una decisión de gasto del dueño.

## Decisión

Se elige la **opción 2: Docker Compose en la PC del local**, con la **opción 1 (instalación nativa) como alternativa** si la PC no puede correr Docker de forma estable. La opción 4 se le plantea al dueño si la PC del local no alcanza.

- **Por qué Docker Compose:** es la forma más repetible de instalar y actualizar el sistema, y la que menos depende de cómo esté configurada la PC. Lo que funciona en desarrollo y en el CI funciona igual en el local.
- **Cómo queda:**
  - Contenedores: `db` (PostgreSQL 16, volumen persistente, **sin puerto publicado** hacia la red), `backend` (Node.js; corre las migraciones al arrancar) y `nginx` (sirve el frontend compilado y redirige `/api` al backend). Solo Nginx escucha en la red local (puerto 80).
  - Zona horaria `America/La_Paz` en los contenedores (RNF-05, #27).
  - Variables y contraseñas en un `.env` en la PC del local, **nunca en el repo** (#14).
  - Arranque automático: `restart: unless-stopped` y Docker configurado para iniciar con el sistema operativo. Se prueba apagando y encendiendo la PC.
  - **Red:** IP fija para la PC (reserva DHCP en el router) o un nombre en la red, para que los dispositivos siempre encuentren el sistema. **No se abre ningún puerto hacia internet.**
  - **HTTP dentro de la red local** para la web. Como el tráfico viaja por el WiFi, el WiFi tiene que tener contraseña (WPA2 o superior). Si la app móvil (ADR-005) o el navegador exigen HTTPS, se agrega un certificado local en un ADR aparte.
- **Cuándo:** en la Etapa 7. Antes, el archivo de Docker Compose también sirve para levantar el proyecto en desarrollo (#20).
- **Pendiente con el dueño (P-13):** qué PC se usa, con qué sistema operativo y memoria, si queda encendida, y acceso al router para fijar la IP. Con esa respuesta se confirma Docker o la instalación nativa.

## Consecuencias

- **Positivas:**
  - Instalación y actualización en pocos comandos, documentadas en `docs/04_implementacion/`.
  - El sistema no depende de internet para funcionar (junto con el ADR-002).
  - La base no queda expuesta en la red: solo el backend la ve.
  - El mismo archivo se reutiliza si en la Etapa 9 se pasa a un servidor en la nube.
- **Negativas o riesgos:**
  - Si la PC se apaga o falla, el sistema se cae para todos. Hace falta el respaldo del ADR-004 y un procedimiento para volver al Excel mientras tanto.
  - Docker Desktop en Windows consume memoria y a veces necesita actualizaciones que piden reiniciar.
  - Sin HTTPS, alguien conectado al mismo WiFi podría ver el tráfico; depende de que el WiFi esté protegido.
- **Qué hay que hacer ahora:**
  - Preguntar P-13 el 10/12.
  - Etapa 3: un `docker-compose.yml` de desarrollo (PostgreSQL) para la guía de instalación (#20).
  - Etapa 7: crear las issues de Docker Compose de producción, Nginx, arranque automático, IP fija y prueba de apagado.

**Relacionado:** RNF-01, RNF-02, RNF-05, RNF-10 · ADR-002 · ADR-004 · ADR-005 · #14 · #20 · #27
