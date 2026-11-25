# Plan de pruebas

> Versión 0.1 · 25/11/2026 · Issue #18. La lista de casos está en [`casos.md`](casos.md).

## 1. Objetivo

Tener una **red de seguridad** antes de corregir bugs (Etapa 4), completar funcionalidades (Etapa 6) y migrar a TypeScript (Etapa 5): un conjunto de pruebas automáticas que fija cómo se comporta hoy la API y avisa si un cambio rompe algo.

Las pruebas parten de los casos que se probaron a mano en el análisis (secciones 10 a 12: códigos S, T, F, A, P y R) y de la matriz de permisos (`docs/03_diseno/permisos.md`).

## 2. Qué se prueba y con qué

| Nivel | Qué cubre | Herramienta | Dónde |
|-------|-----------|-------------|-------|
| **Integración de la API** (la mayoría) | Una petición HTTP real a la app de Express, con autenticación, permisos, controladores, servicios y una base PostgreSQL real | Jest + Supertest | `backend/tests/<módulo>/*.test.js` |
| **Unitarias** | Funciones puras, sin base (por ejemplo, la guardia de la base de pruebas) | Jest | junto a las de integración |
| **Manuales / E2E** | Lo que solo se ve en el navegador: XSS en pantalla, responsive, consola, fechas que arma el frontend | A mano, con la lista de [`casos.md`](casos.md); E2E automático más adelante | `docs/05_pruebas/` |

**Por qué casi todo es de integración:** los bugs del análisis están en la combinación de rutas, servicios y base (un `include` de Sequelize que pierde productos borrados, una columna NOT NULL que el modelo no conoce, pagos que el controlador no pasa al servicio). Una prueba unitaria con la base simulada no los vería. Supertest llama a la app de Express **sin abrir un puerto** (`request(app)`), así que las pruebas son rápidas y no chocan con un servidor que esté corriendo.

## 3. Cómo correr las pruebas

```bash
# 1. Una base PostgreSQL aparte para las pruebas (si no existe, las pruebas la crean)
# 2. En backend/.env:
DATABASE_URL_TEST=postgres://usuario:contraseña@localhost:5432/mesa_dragon_test

cd backend
npm test                 # todas las pruebas
npm test -- ordenes      # solo los archivos cuyo nombre contiene "ordenes"
npm run test:watch       # vuelve a correr al guardar
npm run test:cobertura   # informe de cobertura en backend/coverage/
MOSTRAR_LOGS=1 npm test  # muestra los console.log y console.error de la app (silenciados por defecto)
```

No hace falta definir `JWT_SECRET` ni migrar a mano: las pruebas usan sus propios valores y aplican las migraciones solas.

## 4. Decisiones (y por qué)

### 4.1 Una base de datos aparte, con su propia variable

Las pruebas usan `DATABASE_URL_TEST` y **nunca** `DATABASE_URL`. El entorno `test` de `src/config/config.js` solo lee esa variable, y si falta, la app no arranca en vez de conectarse a otra base.

- **Por qué:** cada corrida **borra y vuelve a llenar** la base. Si apuntara a la base de desarrollo (o, peor, a la del local), se perderían los datos.
- **Por qué no una base en memoria (SQLite):** el sistema usa cosas propias de PostgreSQL (tipos `TIME` y `ENUM`, `iLike`, `RETURNING`, claves compuestas). Probar contra otro motor daría falsos verdes. La misma base que en producción, pero vacía.

### 4.2 La guardia: las pruebas se niegan a correr contra una base que no es de pruebas

Antes de borrar nada, `tests/soporte/baseDePruebas.js` comprueba tres cosas y, si alguna falla, se detiene sin tocar la base:

1. `NODE_ENV` es `test`.
2. El nombre de la base termina en **`_test`**.
3. `DATABASE_URL_TEST` **no** apunta a la misma base que `DATABASE_URL` (mismo servidor, puerto y nombre; da igual el usuario o escribir `127.0.0.1` en lugar de `localhost`).

Se verifica en el arranque (`globalSetup`) **y** justo antes de cada `TRUNCATE`: el control está pegado a la operación peligrosa, no solo al principio. La guardia es una función pura con sus propias pruebas (`tests/infraestructura/guardia.test.js`).

- **Por qué el sufijo `_test`:** es una convención que se ve a simple vista y que no se cumple por accidente. Una configuración copiada de desarrollo (`mesa_dragon_db`) no pasa.

### 4.3 Cómo queda limpia la base entre pruebas

| Momento | Qué se hace | Para qué |
|---------|-------------|----------|
| Una vez por corrida (`globalSetup`) | `DROP SCHEMA public CASCADE` y **todas las migraciones** desde cero | Cada corrida prueba también que las migraciones funcionan en una base vacía (S1) |
| Antes de **cada archivo** (`beforeAll`) | `TRUNCATE` de todas las tablas con `RESTART IDENTITY CASCADE` y el **seed** otra vez | Cada archivo empieza con los mismos datos y los ids empiezan en 1: ningún archivo depende de lo que hizo otro |
| Dentro de un archivo | Cada prueba crea lo que necesita (una orden, una reserva) y no borra lo de las demás | Las pruebas de un archivo pueden leerse de arriba abajo como un flujo |

**Alternativa descartada: una transacción por prueba con rollback.** Es la técnica más rápida, pero acá no sirve: los servicios abren sus propias transacciones (`sequelize.transaction(...)`) y Supertest pasa por el pool de conexiones de la app, así que la prueba no puede envolverlos en una transacción suya sin modificar el código de producción.

**Por qué `TRUNCATE` y no `DELETE`:** vacía todas las tablas de una vez, sin revisar fila por fila, respeta las claves foráneas con `CASCADE` y reinicia los contadores de id (`RESTART IDENTITY`), algo que `DELETE` no hace. El reinicio completo (vaciar + seed) tarda unos 0,15 s por archivo.

### 4.4 En serie, no en paralelo

Jest corre los archivos en paralelo por defecto. Acá se fija `maxWorkers: 1` en `jest.config.js`.

- **Por qué:** todos los archivos comparten **una sola base**. En paralelo, el `TRUNCATE` de un archivo borraría los datos de otro en plena prueba: fallas al azar, imposibles de reproducir.
- **Costo:** con unos cientos de pruebas, la corrida completa debería seguir por debajo del minuto; hoy tarda segundos.
- **Si crece:** una base por proceso (`mesa_dragon_test_1`, `_2`…, con `JEST_WORKER_ID`). Queda como mejora si la suite pasa de un par de minutos.

### 4.5 Bugs conocidos: `test.failing` con el número de la issue

Muchos casos del análisis son bugs que todavía no se corrigieron. Cada uno se escribe con el **resultado correcto** (el de la issue) y se marca con `test.failing`, con el número de la issue en el nombre:

```js
test.failing('T6 · finalizar con QR 30 + EFECTIVO 31 registra los dos pagos (#21)', async () => {
    // ...espera dos transacciones: QR 30.00 y EFECTIVO 31.00
});
```

- **Qué hace Jest:** una prueba `failing` **pasa mientras falle** y **falla si empieza a pasar**. El CI queda en verde con los bugs documentados.
- **Por qué no `test.skip`:** una prueba saltada no se ejecuta y se olvida. Con `failing`, el día que alguien corrige el bug (incluso sin querer) la suite lo avisa: "esta prueba ya pasa, cámbiala a `test`".
- **Por qué no dejarla fallar:** un CI siempre en rojo se deja de mirar, y entonces no avisa cuando se rompe algo nuevo.
- **El flujo en la Etapa 4:** el PR que corrige #21 cambia `test.failing` por `test` en sus casos. La prueba pasa de "documenta el bug" a "evita que vuelva".
- **Cuidado:** una prueba `failing` pasa con **cualquier** error, también con uno de la propia prueba (un typo). Por eso cada una se escribe primero como `test`, se confirma que falla **por el motivo del bug** (el valor obtenido es el del análisis) y recién ahí se marca `failing`.

### 4.6 Entorno fijo

- **Zona horaria `America/La_Paz`** (`tests/soporte/entorno.js`): el local está en Bolivia y el CI de #19 corre en UTC. Con la zona fija, las pruebas dan lo mismo en las dos máquinas y los bugs de zona horaria (#27) se ven igual en todas.
- `JWT_SECRET` y `JWT_EXPIRATION` propios de las pruebas: no hace falta tocar el `.env`.
- **Solo datos ficticios:** el seed de desarrollo (tres usuarios `…@mesadragon.test`) y lo que crea cada prueba. Nunca datos reales del local.

## 5. Organización de los archivos

```
backend/
├── jest.config.js
└── tests/
    ├── soporte/                 ← infraestructura, no son pruebas
    │   ├── entorno.js           ← variables de entorno de las pruebas
    │   ├── baseDePruebas.js     ← guardia, recrear esquema, reiniciar datos
    │   ├── globalSetup.js       ← una vez por corrida
    │   ├── antesDeCadaArchivo.js← antes de cada archivo: base recién sembrada
    │   └── api.js               ← comoRol('MESERO'), anonimo, iniciarSesion
    ├── infraestructura/         ← la guardia y la base de pruebas
    ├── auth/                    ← login, token, matriz de permisos
    ├── ordenes/                 ← órdenes, ítems, descuentos, pagos, comandas, dashboard
    ├── reservas/
    ├── asistencia/
    └── catalogo/                ← productos, juegos, categorías, pisos y mesas
```

**Nombres:** `describe` por funcionalidad y, en cada prueba, el código del caso cuando viene del análisis: `'T10 · borrar un producto no cambia el total de una orden abierta (#22)'`. Así se puede buscar un caso por su código en el código, en `casos.md` y en las issues.

## 6. Qué no cubren (todavía)

- **El frontend:** no hay pruebas automáticas del navegador. Los casos que solo se ven ahí quedan como **pruebas manuales** en `casos.md` (categoría 🖥). Una herramienta E2E (por ejemplo, Playwright) se evalúa cuando el frontend pase a Vite (ADR-002).
- **Reglas que todavía no están definidas** (⚠ en los requisitos): su prueba se escribe junto con la issue que las implementa, cuando la regla esté clara (categoría ⏳).
- **Rendimiento y carga:** fuera del alcance de la entrega.

## 7. Integración continua

El workflow de #19 corre `npm run check` (lint y formato) y `npm test` en cada PR, con un servicio de PostgreSQL y `DATABASE_URL_TEST` definida en el propio workflow (sin secretos reales). Un PR con una prueba rota queda en rojo.
