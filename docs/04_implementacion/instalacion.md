# Guía de instalación

> Versión 0.2 · 25/11/2026 · Issues #20 y #113 · RNF-10
> **Probada en Linux y en Windows** desde un clon limpio, siguiendo esta guía al pie de la letra (detalle en los PRs de #20 y #113).

Esta guía deja el sistema funcionando **en una computadora de desarrollo**, con PostgreSQL y Node.js instalados directamente (instalación nativa). La instalación en la PC del local con Docker Compose llega en la Etapa 7 (ADR-003).

## 1. Resumen: tres comandos

Con Node.js 26 y PostgreSQL ya instalados, el repositorio clonado y `backend/.env` completo (sección 3):

```bash
cd drg/backend
npm install            # 1. instala las dependencias
npm run db:preparar    # 2. crea la base, aplica las migraciones y carga el seed
npm start              # 3. arranca el servidor
```

Después se abre **http://localhost:3000** en el navegador y se entra con un usuario de la sección 4.

## 2. Requisitos

| Programa | Versión | Para qué | Cómo comprobarlo |
|----------|---------|----------|------------------|
| **Node.js** | **26** (LTS) | Corre el backend. Trae `npm` | `node -v` → `v26.x.x` |
| **PostgreSQL** | **16** | Base de datos | `psql --version` → `16.x` (en Windows, ver la sección 7) |
| **Git** | cualquiera reciente | Clonar el repositorio | `git --version` |
| Navegador | Chrome, Edge o Firefox actuales | El frontend usa módulos de JavaScript | — |

- **Por qué Node 26:** es la versión LTS activa (soporte hasta abril de 2029). Está fijada en `.nvmrc` y en `engines` de los `package.json`, y el CI usa la misma. Con otra versión, `npm install` muestra un aviso `EBADENGINE`: el sistema puede funcionar, pero no es la versión probada. Con [nvm](https://github.com/nvm-sh/nvm) basta `nvm install` y `nvm use` en la raíz del repositorio.
- **Por qué PostgreSQL 16:** es la versión del ADR-003 y la que usan las pruebas del CI.
- Hace falta saber el **usuario y la contraseña** de PostgreSQL (en Linux suele ser el usuario `postgres`; en Windows, la contraseña que se elige al instalarlo).

## 3. Instalación paso a paso

### 3.1 Clonar el repositorio

```bash
git clone https://github.com/MarcelQuiroF/drg.git
cd drg
```

### 3.2 Crear `backend/.env`

```bash
cp backend/.env.example backend/.env
```

Abrir `backend/.env` y completar:

| Variable | Qué poner | Ejemplo |
|----------|-----------|---------|
| `DATABASE_URL` | Usuario, contraseña, servidor, puerto y **nombre de la base**. La base **no** hace falta crearla: la crea el paso 3.4 | `postgres://postgres:mi_clave@localhost:5432/mesa_dragon_db` |
| `JWT_SECRET` | Una cadena larga y aleatoria. Se genera con el comando de abajo | `3f9a…` (64 caracteres) |
| `PORT` | Opcional (3000 por defecto) | `3000` |
| `JWT_EXPIRATION` | Opcional (8 h por defecto) | `8h` |
| `DATABASE_URL_TEST` | Solo para las pruebas automáticas (sección 5). Otra base, terminada en `_test` | `postgres://postgres:mi_clave@localhost:5432/mesa_dragon_test` |

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- Si la contraseña tiene caracteres especiales (`@`, `:`, `/`, `#`, `%`), hay que escribirlos codificados en la URL: `@` → `%40`, `#` → `%23`, `%` → `%25`.
- `backend/.env` está en `.gitignore`: **nunca** se sube al repositorio.

### 3.3 Instalar las dependencias

```bash
cd backend
npm install
```

### 3.4 Preparar la base: `npm run db:preparar`

```bash
npm run db:preparar
```

El script (`backend/scripts/prepararBase.js`) hace tres cosas:

1. **Crea la base** de `DATABASE_URL` si no existe. No hace falta `psql` ni pgAdmin.
2. **Aplica las migraciones** pendientes (`sequelize-cli db:migrate`).
3. **Carga el seed** de desarrollo, solo si la base todavía no tiene empleados.

Termina con `Base lista. Siguiente paso: npm start`.

Se puede **repetir sin riesgo**: si la base ya tiene datos, solo aplica las migraciones nuevas y no vuelve a cargar el seed. Por eso es también el comando para **actualizar** después de un `git pull`.

### 3.5 Arrancar el servidor

```bash
npm start
```

Entre otras líneas, tiene que mostrar:

```
Conexión a la base de datos exitosa.
Servidor Express escuchando en http://localhost:3000/api/v1
```

El backend sirve también el frontend. Se abre **http://localhost:3000** y aparece la pantalla de inicio de sesión. Para desarrollar, `npm run dev` reinicia el servidor al guardar un archivo (nodemon).

Para detenerlo: `Ctrl + C` en la terminal.

## 4. Primer ingreso y contraseñas iniciales

El seed carga datos **ficticios** (pisos, mesas, catálogo, tabla de descuentos por atraso, configuración de reservas) y tres usuarios:

| Rol | CI | Contraseña inicial | Al entrar va a |
|-----|----|--------------------|----------------|
| `ADMIN` | `1234567LP` | `drg-desarrollo` | Panel de administración |
| `CAJERO` | `2345678LP` | `drg-desarrollo` | Pantalla operativa |
| `MESERO` | `3456789LP` | `drg-desarrollo` | Pantalla operativa |

Estas contraseñas están publicadas en el repositorio: **sirven solo para desarrollo** y hay que cambiarlas si el sistema va a usarse con datos reales.

### Cambiar una contraseña

Se cambia **editando al empleado desde el panel del ADMIN**:

1. Entrar como `ADMIN`.
2. En el menú de la izquierda, abrir **Gestionar empleado**.
3. En la tarjeta del empleado, pulsar el **lápiz** (editar).
4. Escribir la contraseña nueva en el campo **Contraseña** (si se deja vacío, la contraseña no cambia). No tocar los demás campos.
5. Pulsar **Guardar Empleado**.

Desde ese momento el empleado entra con la contraseña nueva y la anterior deja de funcionar. Probado con el cajero y el mesero.

> ⚠ **Bug conocido (#109): por ahora, no editar al ADMIN.** El formulario no tiene la opción `ADMIN` en el selector de rol y, al guardar, le deja el rol vacío: el administrador pierde el acceso al panel. Hasta que se corrija #109 (Etapa 4), la contraseña del ADMIN se queda en `drg-desarrollo`, lo que solo es aceptable en una máquina de desarrollo.
>
> Si ya pasó, se recupera desde `psql` (o pgAdmin) conectado a la base: `UPDATE empleado SET rol = 'ADMIN' WHERE ci = '1234567LP';`

## 5. Lint y pruebas automáticas

**Lint y formato** (ESLint + Prettier). Las herramientas se instalan en la **raíz** del repositorio:

```bash
cd drg            # la raíz, no backend/
npm install
npm run check     # lint + revisión de formato
```

**Pruebas** (Jest + Supertest). Necesitan `DATABASE_URL_TEST` en `backend/.env`: una base **aparte**, con un nombre terminado en `_test`. Las pruebas la crean si falta y la vacían en cada corrida, así que nunca tiene que ser la base de `DATABASE_URL` (si lo es, se niegan a correr).

```bash
cd backend
npm test          # unas 370 pruebas, menos de 20 segundos
```

El CI corre lo mismo (`npm run check` y `npm test`) en cada PR. Más detalle en el [plan de pruebas](../05_pruebas/plan-de-pruebas.md) y en [`CONTRIBUTING.md`](../../CONTRIBUTING.md).

## 6. Problemas comunes

| Mensaje | Causa | Solución |
|---------|-------|----------|
| `Faltan variables de entorno obligatorias: …` (al arrancar) o `Falta DATABASE_URL` (en `db:preparar`) | No existe `backend/.env` o está incompleto | Repetir el paso 3.2 |
| `No se pudo preparar la base: connect ECONNREFUSED 127.0.0.1:5432` | PostgreSQL no está corriendo, o escucha en otro puerto | Iniciar el servicio de PostgreSQL; revisar el puerto en `DATABASE_URL` |
| `password authentication failed for user "…"` | Usuario o contraseña incorrectos en `DATABASE_URL` | Corregirlos (y codificar los caracteres especiales, paso 3.2) |
| `permission denied to create database` | El usuario de PostgreSQL no puede crear bases | Usar el usuario `postgres`, o crear la base a mano y volver a correr `npm run db:preparar` |
| `npm warn EBADENGINE Unsupported engine` con `required: { node: '26.x' }` | La versión de Node no es la 26 | Instalar Node 26 (sección 2) |
| Dice `Servidor Express escuchando…` pero la página no carga o muestra otra cosa | Ya había algo en el puerto 3000 (¿otro `npm start` en otra terminal?). Por un bug (#110), el servidor no avisa que el puerto está ocupado | Cerrar el otro proceso, o cambiar `PORT` en `backend/.env` |

**Volver a empezar con una base limpia** (borra **todos** los datos de la base de `DATABASE_URL`; solo en desarrollo):

```bash
cd backend
npx sequelize-cli db:drop
npm run db:preparar
```

## 7. Windows

> ✅ **Probada en Windows** el 25/11/2026 (Marcelo), desde un clon nuevo: todo funcionó tal cual, sin cambios. Los pasos de las secciones 3 a 6 son los mismos; aquí solo van las diferencias.

**Instalar los programas**

1. **Node.js 26 LTS:** instalador `.msi` de [nodejs.org](https://nodejs.org/). Dejar marcada la opción que lo agrega al `PATH`.
2. **PostgreSQL 16:** instalador de EDB desde [postgresql.org/download/windows](https://www.postgresql.org/download/windows/). Anotar la **contraseña del usuario `postgres`** que pide y dejar el puerto **5432**. pgAdmin viene incluido. El instalador no agrega `psql` al `PATH`; no hace falta para esta guía (`npm run db:preparar` crea la base).
3. **Git for Windows:** [git-scm.com](https://git-scm.com/). Los finales de línea los fija `.gitattributes` (LF), sin configurar nada.

Después de instalar, **abrir una terminal nueva** (para que tome el `PATH`) y comprobar: `node -v` → `v26.x.x`.

**Comandos que cambian (PowerShell)**

| Paso | Linux / macOS | Windows (PowerShell) |
|------|---------------|----------------------|
| 3.2 Copiar el `.env` | `cp backend/.env.example backend/.env` | `Copy-Item backend\.env.example backend\.env` |
| 3.2 Editar el `.env` | cualquier editor | `notepad backend\.env` (o VS Code) |
| 3.3 Entrar a la carpeta | `cd backend` | `cd backend` |

El resto (`node -e …`, `npm install`, `npm run db:preparar`, `npm start`, `npm test`) se escribe igual.

**Si algo falla en Windows** (ninguno de estos problemas apareció en la prueba; quedan como ayuda)

- **`npm : No se puede cargar el archivo …\npm.ps1 porque la ejecución de scripts está deshabilitada`:** es la política de ejecución de PowerShell. Usar la terminal *Símbolo del sistema* (cmd), o permitir scripts locales solo para el usuario: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
- **El servicio de PostgreSQL no está iniciado:** *Servicios* (`services.msc`) → `postgresql-x64-16` → *Iniciar*.
- **Aviso del Firewall de Windows** al hacer `npm start`: para usar el sistema solo en esta PC, alcanza con *Redes privadas*. Abrirlo a la red del local (celulares de los meseros) es parte de la Etapa 7.
- **`bcrypt`** trae binarios precompilados para Windows; si `npm install` intentara compilarlo, avisar en una issue (no debería hacer falta instalar herramientas de compilación).

## 8. Fuera de esta guía

- **Docker Compose** (backend + PostgreSQL + Nginx) y la instalación en la PC del local: Etapa 7 (ADR-003). `backend/docker-compose.yml` todavía está vacío.
- **Respaldos** de la base: ADR-004 y #75 (Etapa 7).
- El **manual de usuario** (mesero, cajero, administrador): Etapa 7, en `docs/06_proyecto/`.
