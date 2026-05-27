---

# Documentación de Endpoints API - Sistema DRG

Este documento detalla las rutas del servidor, los datos requeridos para las solicitudes, las restricciones de acceso por roles y los formatos de respuesta exitosa.

---

## 1. Módulo de Autenticación (`/api/v1/auth`)

Maneja el control de acceso inicial al sistema para todo el personal.

### Iniciar Sesión

* **Ruta:** `POST /api/v1/auth/login`
* **Acceso:** Público (Sin Token)
* **Cuerpo de la Solicitud (JSON):**
```json
{
  "ci": "1234567",
  "contrasenia": "password123"
}

```


* **Respuesta Exitosa (200 OK):**
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "empleado": {
    "id": 1,
    "nombre": "Marcelo Quiroga",
    "rol": "ADMIN",
    "ci": "1234567"
  }
}

```



---

## 2. Módulo de Empleados (`/api/v1/empleados`)

Gestión de perfiles de usuarios y personal del restaurante. Todas las rutas de este módulo requieren token JWT en la cabecera (`Authorization: Bearer <token>`).

### Obtener Perfil del Usuario Autenticado

* **Ruta:** `GET /api/v1/empleados/perfil`
* **Acceso:** Autenticado (Cualquier Rol)
* **Respuesta Exitosa (200 OK):**
```json
{
  "empleado": {
    "id": 1,
    "nombre": "Marcelo Quiroga",
    "rol": "ADMIN",
    "ci": "1234567"
  }
}

```



### Listar Todos los Empleados

* **Ruta:** `GET /api/v1/empleados`
* **Acceso:** `ADMIN`, `CAJERO`
* **Parámetros Query (Opcional):** `?activo=true` (Para filtrar solo personal vigente)
* **Respuesta Exitosa (200 OK):**
```json
[
  {
    "id": 1,
    "nombre": "Marcelo Quiroga",
    "rol": "ADMIN",
    "ci": "1234567",
    "activo": true,
    "Horarios": [
      { "id": 2, "dia": "LUNES", "hora_entrada": "08:00:00" }
    ]
  }
]

```



### Crear Nuevo Empleado

* **Ruta:** `POST /api/v1/empleados`
* **Acceso:** `ADMIN`
* **Cuerpo de la Solicitud (JSON):**
```json
{
  "nombre": "Carlos Mendoza",
  "ci": "7654321",
  "contrasenia": "carlos2026",
  "rol": "CAJERO"
}

```


* **Respuesta Exitosa (201 Created):**
```json
{
  "id": 2,
  "nombre": "Carlos Mendoza",
  "ci": "7654321",
  "rol": "CAJERO",
  "activo": true,
  "updatedAt": "2026-05-27T18:00:00.000Z",
  "createdAt": "2026-05-27T18:00:00.000Z"
}

```



### Actualizar Empleado

* **Ruta:** `PUT /api/v1/empleados/:id`
* **Acceso:** `ADMIN`
* **Cuerpo de la Solicitud (JSON):**
```json
{
  "nombre": "Carlos Mendoza Campos",
  "activo": false
}

```


* **Respuesta Exitosa (200 OK):**
```json
{
  "id": 2,
  "nombre": "Carlos Mendoza Campos",
  "ci": "7654321",
  "rol": "CAJERO",
  "activo": false
}

```



---

## 3. Módulo de Asistencias (`/api/v1/asistencias`)

Monitoreo de asistencia diaria y control de penalizaciones por atrasos. Requiere token JWT en la cabecera.

### Obtener Asistencias Registradas Hoy

* **Ruta:** `GET /api/v1/asistencias/hoy`
* **Acceso:** `ADMIN`, `CAJERO`
* **Respuesta Exitosa (200 OK):**
```json
[
  {
    "id": 15,
    "estado": "PRESENTE",
    "aprobado": false,
    "fecha_hora_llegada": "2026-05-27T12:05:23.000Z",
    "Empleado": {
      "id": 3,
      "nombre": "Juan Pérez",
      "rol": "MESERO",
      "ci": "8888888"
    },
    "Horario": {
      "hora_entrada": "12:00:00"
    }
  }
]

```



### Registrar una Nueva Asistencia

* **Ruta:** `POST /api/v1/asistencias`
* **Acceso:** `ADMIN`, `CAJERO`
* **Cuerpo de la Solicitud (JSON):**
```json
{
  "empleado_id": 3,
  "horario_id": 2,
  "estado": "PRESENTE",
  "descuento_id": 1
}

```


* **Respuesta Exitosa (201 Created):**
```json
{
  "message": "Asistencia grabada con éxito.",
  "data": {
    "id": 15,
    "empleado_id": 3,
    "horario_id": 2,
    "estado": "PRESENTE",
    "descuento_id": 1,
    "aprobado": false
  }
}

```



### Aprobar Registro de Asistencia

* **Ruta:** `PUT /api/v1/asistencias/:id/aprobar`
* **Acceso:** `ADMIN`, `CAJERO` (Requiere credenciales del supervisor en el body)
* **Cuerpo de la Solicitud (JSON):**
```json
{
  "ci": "1234567",
  "contrasenia": "password_admin"
}

```


* **Respuesta Exitosa (200 OK):**
```json
{
  "message": "Asistencia aprobada correctamente."
}

```



### Eliminar Registro de Asistencia

* **Ruta:** `DELETE /api/v1/asistencias/:id`
* **Acceso:** `ADMIN`, `CAJERO`
* **Respuesta Exitosa (200 OK):**
```json
{
  "message": "Registro eliminado, empleado regresado a turnos."
}

```
