# Dependencias: cómo revisarlas y actualizarlas

> Versión 0.1 · 25/11/2026 · Issue #111.

El sistema va a correr en la red del local, con los celulares de los meseros conectados a la PC. Una dependencia con una vulnerabilidad conocida es una puerta que ya está documentada en internet, así que las dependencias se revisan **antes de cada entrega** y **una vez al mes**.

## Qué se revisa

| Carpeta | Qué hay | Qué importa |
|---------|---------|-------------|
| `backend/` | La API (`dependencies`) y las herramientas de pruebas (`devDependencies`: Jest, Supertest, nodemon, sequelize-cli) | Sobre todo `npm audit --omit=dev`: es lo que se instala en la PC del local |
| raíz | ESLint y Prettier (solo desarrollo) | Que no haya altas ni críticas |

El frontend no tiene dependencias de npm (los íconos, las fuentes y Chart.js se cargan de un CDN hasta el ADR-002).

## El CI

El job **Dependencias** (`.github/workflows/ci.yml`) corre `npm audit --omit=dev --audit-level=critical` en `backend/` en cada PR y en cada push a `main`:

- **Falla con una vulnerabilidad crítica** en lo que va a producción.
- **No falla con las altas.** `xlsx` tiene una alta sin arreglo (se reemplaza en #57): con `--audit-level=high` el job estaría siempre en rojo y nadie lo miraría. Cuando se cierre #57 conviene subir el nivel a `high`.
- No es un check obligatorio de la protección de `main`. Si se vuelve obligatorio, una vulnerabilidad nueva publicada un día cualquiera bloquea todos los PRs hasta actualizar. Para un desarrollador solo eso es razonable con las críticas, pero lo decide Marcelo en la configuración del repo.
- Las vulnerabilidades se publican todos los días, así que el job puede ponerse rojo en un PR que no tocó dependencias. En ese caso se arregla en un PR aparte (`chore`), no en el que lo descubrió.

**Recomendado (lo activa Marcelo en *Settings → Code security*):** *Dependabot alerts*. GitHub avisa por correo cuando aparece una vulnerabilidad en el `package-lock.json`, sin esperar a que alguien abra un PR.

## Cómo actualizar

1. Crear la issue y la rama (`chore/n-…`), como cualquier cambio.
2. Ver qué hay:
   ```bash
   cd backend
   npm audit --omit=dev      # lo que va a producción
   npm audit                 # todo, incluidas las herramientas de pruebas
   npm outdated              # versiones nuevas, haya o no vulnerabilidades
   ```
3. Aplicar los arreglos **sin versiones mayores**:
   ```bash
   npm audit fix             # nunca --force
   ```
   `npm audit fix` solo instala versiones dentro de los rangos de `package.json` (`^6.37.7` acepta 6.37.8 o 6.40.0, nunca 7.0.0). Por eso normalmente solo cambia `package-lock.json`.
4. Revisar el diff del lock. Para comparar versiones de un vistazo:
   ```bash
   npm ls --omit=dev --all > /tmp/despues.txt   # y lo mismo antes del cambio
   ```
   Si aparece una versión mayor de una dependencia **transitiva** (la eligió otra librería, no nosotros), se mira qué la trae con `npm ls <paquete>`.
5. Probar: `npm run check`, `npm test` y, si cambió algo que las pruebas no cubren (por ejemplo `multer` en la importación de Excel), una prueba a mano.
6. En el PR, anotar las versiones que cambiaron y lo que queda sin arreglar, con el motivo.

### Versiones mayores

`npm audit fix --force` y los arreglos que dicen *"Will install X@N, which is a breaking change"* **no se aplican sin leer**. A veces el "arreglo" es una versión **más vieja**: npm propone `sequelize@3` para la alerta de `uuid` de `sequelize@6`, y `jest@29` para la de `glob` de `jest@30`. Una versión mayor va en su propia issue, después de leer las notas de cambio (*changelog* o *release notes* del repo del paquete) y con las pruebas en verde.

## Lo que queda sin arreglar (25/11/2026)

`npm audit --omit=dev` en `backend/`: **3** (1 alta, 2 moderadas). Antes de #111 eran 11 (1 crítica, 7 altas, 3 moderadas).

| Paquete | Nivel | Por qué queda | Qué hacer |
|---------|-------|---------------|-----------|
| `xlsx` 0.18.5 | alta | La versión de npm de SheetJS no tiene arreglo (*prototype pollution* y ReDoS al leer un archivo). Solo la usa la importación de Excel, que es del ADMIN | Reemplazarla en **#57** |
| `uuid` 8 (dentro de `sequelize` 6) | moderada | La falla está en `v3`, `v5` y `v6` cuando se les pasa un `buf`. `sequelize` solo llama a `v1()` y `v4()` sin `buf`, y ningún modelo usa UUID. `sequelize` 6 exige `uuid ^8`, y el único "arreglo" que ofrece npm es bajar a `sequelize@3` | Nada por ahora. Se resuelve cuando `sequelize` actualice `uuid` (o con Sequelize 7, en un ADR) |
| `sequelize` | moderada | Es la misma alerta de `uuid` vista desde el paquete que la trae | — |

En `backend/` con las herramientas de pruebas: **25** (1 alta, que es `xlsx`, y 24 moderadas). Las moderadas vienen de `glob`, `minimatch` y `js-beautify` dentro de Jest, nodemon y sequelize-cli. Para todas, npm propone bajar de versión mayor. No van a la PC del local.

En la raíz (ESLint y Prettier): **0**.
