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


## 4. Módulo de Productos (`/api/v1/productos`)

Gestión del catálogo de comidas, bebidas y consumibles del establecimiento. Requiere token JWT en la cabecera (`Authorization: Bearer <token>`).

### Listar Todos los Productos

* **Ruta:** `GET /api/v1/productos`
* **Acceso:** Autenticado (`ADMIN`, `CAJERO`, `MESERO`)
* **Respuesta Exitosa (200 OK):**
```json
[
  {
    "id": 1,
    "nombre": "Hamburguesa Dragón",
    "zona": "Cocina",
    "precio": "35.00",
    "activado": true,
    "estado": true,
    "imagen": "hamburguesa_dragon.png"
  }
]

```



### Obtener Producto por ID

* **Ruta:** `GET /api/v1/productos/:id`
* **Acceso:** Autenticado (`ADMIN`, `CAJERO`, `MESERO`)
* **Respuesta Exitosa (200 OK):**
```json
{
  "id": 1,
  "nombre": "Hamburguesa Dragón",
  "zona": "Cocina",
  "precio": "35.00",
  "activado": true,
  "estado": true,
  "imagen": "hamburguesa_dragon.png"
}

```



### Crear Nuevo Producto

* **Ruta:** `POST /api/v1/productos`
* **Acceso:** `ADMIN`
* **Cuerpo de la Solicitud (JSON):**
```json
{
  "nombre": "Papas Fritas Medianas",
  "zona": "Cocina",
  "precio": 15.00,
  "imagen": "papas_medianas.png"
}

```


* **Respuesta Exitosa (201 Created):**
```json
{
  "id": 5,
  "nombre": "Papas Fritas Medianas",
  "zona": "Cocina",
  "precio": "15.00",
  "activado": true,
  "estado": true,
  "imagen": "papas_medianas.png",
  "createdAt": "2026-05-27T18:10:00.000Z"
}

```



### Actualizar Producto

* **Ruta:** `PUT /api/v1/productos/:id`
* **Acceso:** `ADMIN`
* **Cuerpo de la Solicitud (JSON):**
```json
{
  "precio": 18.00,
  "activado": false
}

```


* **Respuesta Exitosa (200 OK):**
```json
{
  "id": 5,
  "nombre": "Papas Fritas Medianas",
  "zona": "Cocina",
  "precio": "18.00",
  "activado": false,
  "estado": true
}

```



### Eliminar Producto (Borrado Lógico)

* **Ruta:** `DELETE /api/v1/productos/:id`
* **Acceso:** `ADMIN`
* **Respuesta Exitosa (200 OK):**
```json
{
  "message": "Mesa eliminada."
}

```



---

## 5. Módulo de Juegos (`/api/v1/juegos`)

Administración de la ludoteca disponible para préstamo y consumo en salón.

### Listar Todos los Juegos

* **Ruta:** `GET /api/v1/juegos`
* **Acceso:** **Público (Sin Token)**
* **Respuesta Exitosa (200 OK):**
```json
[
  {
    "id": 1,
    "nombre": "Catan",
    "precio": "20.00",
    "jugadores_min": 3,
    "jugadores_max": 4,
    "tiempo_partida": 60,
    "activado": true,
    "imagen": "catan.png",
    "enlace": "https://..."
  }
]

```



### Obtener Juego por ID

* **Ruta:** `GET /api/v1/juegos/:id`
* **Acceso:** **Público (Sin Token)**
* **Respuesta Exitosa (200 OK):**
```json
{
  "id": 1,
  "nombre": "Catan",
  "precio": "20.00",
  "jugadores_min": 3,
  "jugadores_max": 4,
  "tiempo_partida": 60,
  "activado": true,
  "imagen": "catan.png"
}

```



### Crear Nuevo Juego

* **Ruta:** `POST /api/v1/juegos`
* **Acceso:** `ADMIN` (Requiere Token)
* **Cuerpo de la Solicitud (JSON):**
```json
{
  "nombre": "Dixit",
  "precio": 15.00,
  "jugadores_min": 3,
  "jugadores_max": 6,
  "tiempo_partida": 30
}

```


* **Respuesta Exitosa (201 Created):**
```json
{
  "id": 8,
  "nombre": "Dixit",
  "precio": "15.00",
  "jugadores_min": 3,
  "jugadores_max": 6,
  "tiempo_partida": 30,
  "activado": true
}

```



### Actualizar Juego

* **Ruta:** `PUT /api/v1/juegos/:id`
* **Acceso:** `ADMIN` (Requiere Token)
* **Cuerpo de la Solicitud (JSON):**
```json
{
  "jugadores_max": 8,
  "enlace": "https://tutorial-dixit.com"
}

```


* **Respuesta Exitosa (200 OK):**
```json
{
  "id": 8,
  "nombre": "Dixit",
  "precio": "15.00",
  "jugadores_min": 3,
  "jugadores_max": 8,
  "tiempo_partida": 30,
  "enlace": "https://tutorial-dixit.com"
}

```



### Eliminar Juego (Borrado Lógico)

* **Ruta:** `DELETE /api/v1/juegos/:id`
* **Acceso:** `ADMIN` (Requiere Token)
* **Respuesta Exitosa (200 OK):**
```json
{
  "message": "Juego eliminado."
}

```



---

## 6. Módulo de Clientes (`/api/v1/clientes`)

Registro de la clientela para control de reservas, consumos y cuentas recurrentes. Requiere token JWT en la cabecera.

### Listar Todos los Clientes

* **Ruta:** `GET /api/v1/clientes`
* **Acceso:** Autenticado (`ADMIN`, `CAJERO`, `MESERO`)
* **Respuesta Exitosa (200 OK):**
```json
[
  {
    "id": 12,
    "nombre": "Juan Pérez",
    "ci": "10203040",
    "telefono": "70012345"
  }
]

```



### Crear / Registrar Cliente (Registro Rápido)

* **Ruta:** `POST /api/v1/clientes`
* **Acceso:** Autenticado (`ADMIN`, `CAJERO`, `MESERO`)
* **Cuerpo de la Solicitud (JSON):**
```json
{
  "nombre": "Alejandro Mendoza",
  "ci": "9876543",
  "telefono": "75098765"
}

```


* **Respuesta Exitosa (210 Created / OK):**
```json
{
  "id": 13,
  "nombre": "Alejandro Mendoza",
  "ci": "9876543",
  "telefono": "75098765",
  "updatedAt": "2026-05-27T18:15:00.000Z",
  "createdAt": "2026-05-27T18:15:00.000Z"
}

```



### Actualizar Información del Cliente

* **Ruta:** `PUT /api/v1/clientes/:id`
* **Acceso:** Autenticado (`ADMIN`, `CAJERO`, `MESERO`)
* **Cuerpo de la Solicitud (JSON):**
```json
{
  "telefono": "69011223"
}

```


* **Respuesta Exitosa (200 OK):**
```json
{
  "id": 13,
  "nombre": "Alejandro Mendoza",
  "ci": "9876543",
  "telefono": "69011223"
}

```



### Eliminar Cliente (Borrado Lógico)

* **Ruta:** `DELETE /api/v1/clientes/:id`
* **Acceso:** `ADMIN`
* **Respuesta Exitosa (200 OK):**
```json
{
  "message": "Cliente eliminado de los registros."
}

```


## 7. Módulo de Órdenes (`/api/v1/ordenes`)

Control operativo de consumos en mesa, procesamiento de cuentas y aplicación de descuentos. Todas las rutas requieren token JWT en la cabecera (`Authorization: Bearer <token>`)

### Listar Todas las Órdenes

* **Ruta:** `GET /api/v1/ordenes`
* **Acceso:** Autenticado (Cualquier rol)
* **Respuesta Exitosa (200 OK):**
```json
[
  {
    "id": 45,
    "total": "120.00",
    "finalizado": false,
    "mesa_id": 3,
    "notas": "Cliente solicita vasos con hielo extra.",
    "createdAt": "2026-05-27T14:00:00.000Z"
  }
]

```

### Obtener Orden por ID
* **Ruta:** `GET /api/v1/ordenes/:id`
* **Acceso:** Autenticado (Cualquier rol)
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "id": 45,
    "total": "120.00",
    "finalizado": false,
    "mesa_id": 3,
    "notas": "Cliente solicita vasos con hielo extra.",
    "ContenedorProductos": [],
    "ContenedorJuegos": []
  }

### Crear una Nueva Orden

* **Ruta:** `POST /api/v1/ordenes`
* **Acceso:** Autenticado (Cualquier rol)
* **Cuerpo de la Solicitud (JSON):**
```json
{
  "mesa_id": 3,
  "notas": "Mesa de cumpleaños"
}

```


* **Respuesta Exitosa (201 Created):**
  ```json
  {
    "id": 46,
    "total": "0.00",
    "finalizado": false,
    "mesa_id": 3,
    "notas": "Mesa de cumpleaños",
    "createdAt": "2026-05-27T14:18:00.000Z"
  }

### Finalizar y Cerrar Cuenta de una Orden

* **Ruta:** `POST /api/v1/ordenes/:id/finalizar`
* **Acceso:** `ADMIN`, `CAJERO`, `MESERO`
* **Respuesta Exitosa (200 OK):**
```json
{
  "message": "Orden finalizada y cuenta cerrada con éxito.",
  "total_pagado": "120.00"
}

```

### Aplicar Descuento a una Orden
* **Ruta:** `POST /api/v1/ordenes/:id/descuento`
* **Acceso:** `ADMIN`, `CAJERO`, `MESERO`
* **Cuerpo de la Solicitud (JSON):**
  ```json
  {
    "descuento_id": 2
  }


* **Respuesta Exitosa (200 OK):**
```json
{
  "message": "Descuento aplicado correctamente a la orden."
}

```



### Listar Descuentos Aplicados a una Orden
* **Ruta:** `GET /api/v1/ordenes/:id/descuentos`
* **Acceso:** `ADMIN`, `CAJERO`, `MESERO`
* **Respuesta Exitosa (200 OK):**
  ```json

  {
    "id": 2,
    "descripcion": "Descuento por Apertura",
    "porcentaje": 10.00
  }


### Quitar Descuento de una Orden

* **Ruta:** `DELETE /api/v1/ordenes/:ordenId/descuento/:descuentoId`
* **Acceso:** `ADMIN`, `CAJERO`, `MESERO`
* **Respuesta Exitosa (200 OK):**
```json
{
  "message": "Descuento removido de la orden con éxito."
}

```

### Actualizar Notas o Comentarios de la Orden
* **Ruta:** `PUT /api/v1/ordenes/:id` 
* **Acceso:** `ADMIN`, `CAJERO`, `MESERO` 
* **Cuerpo de la Solicitud (JSON):**
  ```json
  {
    "notas": "Notas actualizadas: El cliente pagará con QR."
  }

* **Respuesta Exitosa (200 OK):**
```json
{
  "id": 45,
  "notas": "Notas actualizadas: El cliente pagará con QR."
}

```


### Eliminar una Orden (Borrado Lógico)
* **Ruta:** `DELETE /api/v1/ordenes/:id` 
* **Acceso:** `ADMIN`, `CAJERO`, `MESERO` 
* **Respuesta Exitosa (200 OK):**
  ```json
{
  "message": "Orden eliminada del sistema."
}

---

## 8. Módulo de Reportes y Métricas (`/api/v1/reportes`)

Procesamiento de datos estadísticos agregados para auditoría del negocio. Requiere token JWT en la cabecera (`Authorization: Bearer <token>`).

### Obtener Datos Analíticos del Dashboard

* **Ruta:** `GET /api/v1/reportes/dashboard`
* **Acceso:** Exclusivo de **`ADMIN`**
* **Parámetros Query (Opcionales para filtrado personalizado):** `?inicio=YYYY-MM-DD&fin=YYYY-MM-DD`
* **Respuesta Exitosa (200 OK):**
```json
{
  "totales": {
    "ingresos": 5450.00,
    "efectivo": 2150.00,
    "qr": 3300.00,
    "ingresoPromedioDiario": 778.57,
    "ordenes": 84,
    "ordenesPromedioDiario": 12.0,
    "reservas": 14
  },
  "distribucion": {
    "comida": 3850.00,
    "juegos": 1600.00
  },
  "graficas": {
    "etiquetas": ["2026-05-21", "2026-05-22"],
    "ingresos": [450.00, 890.00],
    "ordenes": [8, 14]
  },
  "rankings": {
    "comidas": [["Hamburguesa Dragón", 24], ["Papas Fritas", 18]],
    "juegos": [["Catan", 12], ["Dixit", 9]]
  }
}

```

## 9. Módulo de Configuración del Sistema (`/api/v1/configuracion`)

Ajustes operativos globales del negocio y parámetros de penalizaciones. Requiere token JWT en la cabecera (`Authorization: Bearer <token>`).

### Listar Parámetros de Descuentos por Atraso
* **Ruta:** `GET /api/v1/configuracion/descuentos-atraso`
* **Acceso:** Autenticado (Cualquier rol)
* **Respuesta Exitosa (200 OK):**
  ```json
  [
    {
      "id": 1,
      "minutos_min": 1,
      "minutos_max": 15,
      "monto_descuento": "10.00"
    },
    {
      "id": 2,
      "minutos_min": 16,
      "minutos_max": 30,
      "monto_descuento": "25.00"
    }
  ]


### Listar Todas las Configuraciones Globales

* **Ruta:** `GET /api/v1/configuracion` 
* **Acceso:** Autenticado (Cualquier rol) 
* **Respuesta Exitosa (200 OK):**
```json

[
{ "id": 1, "clave": "minutos_tolerancia", "valor": "20" },
{ "id": 2, "clave": "ventana_llegada", "valor": "30" }
]

```

### Actualización Masiva de Configuraciones
* **Ruta:** `PUT /api/v1/configuracion` 
* **Acceso:** Autenticado (Cualquier rol) 
* **Cuerpo de la Solicitud (JSON):**
  ```json

  { "clave": "minutos_tolerancia", "valor": "15" },
  { "clave": "ventana_llegada", "valor": "45" }


* **Respuesta Exitosa (200 OK):**
```json
{
  "message": "Configuraciones globales actualizadas de manera masiva."
}

```
