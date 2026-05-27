# DRG - Mesa Dragón

Sistema de gestión integral y analítica diseñado específicamente para restaurantes y cafés con juegos de mesa. El sistema permite administrar en tiempo real el estado del salón, procesar pedidos y transacciones, controlar la asistencia del personal, un panel de control financiero.

## Características Principales

* **Panel de Mesas:** Visualización distribuida por pisos. Control de estados síncronos (Disponible, En Uso, Reservado) con aviso de próximas reservas y actualización silenciosa automatizada.
* **Módulo de Asistencia con Doble Verificación:** Control de ingreso y salida del personal activo según el día de la semana. Calcula de forma automática los minutos de atraso basándose en el horario asignado, permitiendo aplicar descuentos. Cuenta con un sistema de auditoría que requiere la firma digital (CI y contraseña encriptada) de un supervisor para aprobar o revertir los registros.
* **Dashboard Administrativo Interactivo:** Panel estadístico que procesa datos históricos o en rangos personalizados. Muestra indicadores clave de rendimiento (KPIs) como ingresos totales, pagos (Efectivo vs. QR), ingresos promedio, volumen de órdenes, flujo de reservas y un Top 5 de productos y juegos más solicitados.
* **Arquitectura Single Page Application (SPA):** Interfaz fluida basada que inyecta componentes de forma dinámica en el cliente, optimizando el consumo de recursos.

## 🛠️ Tecnologías Utilizadas

* **Backend:** Node.js, Express.js (Router, Middlewares de autenticación JWT y control de acceso por roles).
* **Seguridad:** Bcrypt (encriptación de credenciales) y JSON Web Tokens (JWT).
* **Base de Datos:** PostgreSQL con Sequelize ORM.
* **Frontend:** HTML5, CSS3, JavaScript Vanilla (ES6+ Modules).
* **Librerías Gráficas:** Chart.js, Boxicons, FontAwesome.

## Requisitos Previos

* Node.js (versión 16 o superior)
* PostgreSQL (Base de datos local o remota)
* Navegador web moderno con soporte para módulos ES6

## Configuración del Entorno

Crea un archivo `.env` en la raíz de la carpeta `backend` siguiendo la siguiente estructura:

```env
PORT=3000

# Configuración de Base de Datos
DATABASE_URL=postgres://usuario:contraseña@localhost:5432/mesa_dragon_db
DATABASE_URL2=postgres://usuario:contraseña@localhost:5432/mesa_dragon_db

# Seguridad
JWT_SECRET=tu_clave_secreta_super_segura
JWT_EXPIRATION=8h
```

## Instalación y Despliegue

### 1. Clonar el repositorio
```bash
git clone [https://github.com/MarcelQuiroF/drg.git](https://github.com/MarcelQuiroF/drg.git)
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


## 👥 Estructura de Roles

* **`ADMIN`:** Acceso exclusivo a la interfaz de administración (`indexAdmin.html`), reportes gráficos financieros, edición de menús, configuraciones de tolerancia de tiempo e inactivación/activación de personal y áreas del salón.
* **`CAJERO` / `MESERO`:** Acceso a la interfaz operativa (`index.html`) para control de comandas, asignación de clientes a mesas, gestión de reservas del día y toma de asistencias.

