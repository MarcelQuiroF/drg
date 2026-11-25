# DRG - Mesa Dragón

[![CI](https://github.com/MarcelQuiroF/drg/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/MarcelQuiroF/drg/actions/workflows/ci.yml)

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

* Node.js **26** (LTS). La versión está fijada en `.nvmrc` y en `engines`; el CI usa la misma
* PostgreSQL (Base de datos local o remota)
* Navegador web moderno con soporte para módulos ES6

## Instalación

La guía completa, con los requisitos, las variables de entorno, el primer ingreso, las pruebas, los problemas comunes y los pasos para Windows, está en **[`docs/04_implementacion/instalacion.md`](docs/04_implementacion/instalacion.md)**.

En resumen, con Node.js y PostgreSQL ya instalados:

```bash
git clone https://github.com/MarcelQuiroF/drg.git
cd drg/backend
cp .env.example .env     # completar DATABASE_URL y JWT_SECRET
npm install
npm run db:preparar      # crea la base, aplica las migraciones y carga el seed
npm start                # http://localhost:3000
```

Los usuarios de desarrollo (ADMIN, CAJERO y MESERO) y cómo cambiar sus contraseñas están en la sección 4 de la guía.

## Calidad: lint, pruebas y CI

```bash
npm install && npm run check     # en la raíz: ESLint + Prettier
cd backend && npm test           # pruebas automáticas (necesitan DATABASE_URL_TEST)
```

Detalle en el [plan de pruebas](docs/05_pruebas/plan-de-pruebas.md) y en [`CONTRIBUTING.md`](CONTRIBUTING.md#6-estilo-de-código).


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
