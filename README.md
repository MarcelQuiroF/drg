# DRG - Mesa Dragón

Sistema de gestión diseñado para un café con juegos de mesa. Permite administrar en tiempo real el estado del salón, tomar pedidos de comida, bebida y juegos, cobrar, gestionar reservas, controlar la asistencia del personal y consultar un panel de control financiero.

> **Estado del proyecto (noviembre de 2026):** en continuación. El sistema funciona como demo, pero tiene errores conocidos que se están corrigiendo antes de entregarlo al negocio. El plan está en los [milestones](https://github.com/MarcelQuiroF/drg/milestones) y en las [issues](https://github.com/MarcelQuiroF/drg/issues) del repo.

## Características Principales

* **Panel de Mesas:** Visualización distribuida por pisos. Control de estados síncronos (Disponible, En Uso, Reservado) con aviso de próximas reservas y actualización silenciosa automatizada.
* **Módulo de Asistencia con Doble Verificación:** Registro de la llegada del personal según su horario de cada día. Calcula los minutos de atraso según el horario asignado y el descuento correspondiente. La aprobación requiere la firma (CI y contraseña) de un supervisor.
* **Dashboard Administrativo Interactivo:** Panel estadístico que procesa datos históricos o en rangos personalizados. Muestra indicadores clave de rendimiento (KPIs) como ingresos totales, pagos (Efectivo vs. QR), ingresos promedio, volumen de órdenes, flujo de reservas y un Top 5 de productos y juegos más solicitados.
* **Arquitectura Single Page Application (SPA):** Interfaz que carga cada vista de forma dinámica en el navegador, sin recargar la página.
* **Comandas por zona:** Impresión de los pedidos separados para cocina y cafetería.
* **Importación desde Excel:** Carga masiva de productos y juegos con plantillas.

## 🛠️ Tecnologías Utilizadas

* **Backend:** Node.js, Express.js (Router, Middlewares de autenticación JWT y control de acceso por roles).
* **Seguridad:** Bcrypt (encriptación de credenciales) y JSON Web Tokens (JWT).
* **Base de Datos:** PostgreSQL con Sequelize ORM.
* **Frontend:** HTML5, CSS3, JavaScript Vanilla (ES6+ Modules).
* **Librerías Gráficas:** Chart.js, Boxicons, FontAwesome.

La arquitectura está descrita en [`docs/03_diseno/arquitectura.md`](docs/03_diseno/arquitectura.md) y las decisiones técnicas, en los [ADR](docs/03_diseno/adr/).

## Requisitos Previos

* Node.js **18 o superior** (Express 5 no funciona con versiones anteriores)
* PostgreSQL (Base de datos local o remota)
* Navegador web moderno con soporte para módulos ES6

## Configuración del Entorno

Crea un archivo `.env` en la raíz de la carpeta `backend` siguiendo la siguiente estructura:

```env
PORT=3000

# Base de datos: la usan las migraciones, el seed y la aplicación
DATABASE_URL=postgres://usuario:contraseña@localhost:5432/mesa_dragon_db

# Seguridad
JWT_SECRET=una_clave_larga_y_aleatoria
JWT_EXPIRATION=8h
```

| Variable | Para qué |
|----------|----------|
| `PORT` | Puerto del servidor (3000 por defecto) |
| `DATABASE_URL` | Conexión a PostgreSQL |
| `JWT_SECRET` | Clave para firmar las sesiones. Es obligatoria: sin ella el login falla |
| `JWT_EXPIRATION` | Duración de la sesión (por ejemplo `8h`) |

> ⚠ **No definas `DATABASE_URL2`.** Si existe, la aplicación la usa en lugar de `DATABASE_URL`, mientras que las migraciones siguen usando `DATABASE_URL`: podrías migrar una base y correr la aplicación contra otra. Se unifica en [#14](https://github.com/MarcelQuiroF/drg/issues/14).

## Instalación y Despliegue

### 1. Clonar el repositorio
```bash
git clone https://github.com/MarcelQuiroF/drg.git
cd drg
```

### 2. Configurar el Backend
```bash
cd backend
npm install
```

### 3. Ejecutar Migraciones y Seeds
```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

### 4. Iniciar el Servidor
```bash
npm start
```

El sistema queda en `http://localhost:3000` (la API, en `http://localhost:3000/api/v1`).

### 5. Primer ingreso

El seed carga datos **ficticios** de desarrollo (pisos, mesas, catálogo, la tabla de descuentos por atraso y la configuración de reservas) y tres usuarios:

| Rol | CI | Contraseña inicial |
|-----|----|--------------------|
| `ADMIN` | `1234567LP` | `drg-desarrollo` |
| `CAJERO` | `2345678LP` | `drg-desarrollo` |
| `MESERO` | `3456789LP` | `drg-desarrollo` |

Estas credenciales son **solo para desarrollo** y son públicas (están en este README). Si el seed se usa en el local, el administrador tiene que cambiar las contraseñas al instalar desde *Empleados* (o borrar los usuarios de prueba). Una guía de instalación completa llega con [#20](https://github.com/MarcelQuiroF/drg/issues/20).

El seed corre dentro de una transacción: si algo falla, no deja datos a medias. `npx sequelize-cli db:seed:undo:all` borra solo lo que insertó el seed.


## 👥 Estructura de Roles

* **`ADMIN`:** Acceso exclusivo a la interfaz de administración (`indexAdmin.html`), reportes gráficos financieros, edición de menús, configuraciones de tolerancia de tiempo e inactivación/activación de personal y áreas del salón.
* **`CAJERO` / `MESERO`:** Acceso a la interfaz operativa (`index.html`) para tomar pedidos, cobrar, imprimir comandas, asignar mesas, gestionar reservas y registrar asistencias. Los dos roles tienen casi los mismos permisos, para que cualquiera pueda abrir el sistema si el otro se atrasa.

El detalle de qué puede hacer cada rol está en la [matriz de permisos](docs/03_diseno/permisos.md).

## 📚 Documentación

La documentación del proyecto está en [`docs/`](docs/README.md), ordenada por disciplina (negocio, requisitos, diseño, implementación, pruebas y proyecto). La referencia de la API está en [`docs/03_diseno/endpoints.md`](docs/03_diseno/endpoints.md).

Las convenciones para contribuir (ramas, commits, PRs) están en [`CONTRIBUTING.md`](CONTRIBUTING.md).

## 👏 Créditos

Proyecto iniciado en equipo en la Universidad Católica Boliviana "San Pablo" (Tarija, 2025–2026); continuado, completado y entregado al negocio por **Marcelo Quiroga**.

| Integrante | Aporte en el proyecto original |
|------------|--------------------------------|
| Marcelo Gabriel Quiroga Fernandez | Backend (API, base de datos y lógica de negocio), Data Warehouse / Power BI y documentación |
| Alex Ricardo Quispe Estrada | Frontend: diseño e interfaz |
| Mateo Nair Caba Mercado | App Android para meseros y documentación |
| Rolando Antonio Cuellar Cassab | Apoyo en Data Warehouse / Power BI y presentaciones |

El detalle está en [`docs/01_negocio/creditos.md`](docs/01_negocio/creditos.md).
