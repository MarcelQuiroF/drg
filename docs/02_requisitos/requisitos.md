# Requisitos de DRG – Mesa Dragón

> **Versión 0.1 · 24/11/2026 · Estado: borrador, sin validar con el dueño.**
> Reconstruidos a partir de los documentos del equipo original (ver [Fuentes en el contexto del negocio](../01_negocio/contexto.md#fuentes)). Se reescribieron para que cada requisito sea **uno solo, verificable y con su fuente**. Donde los documentos se contradicen o falta un dato, el requisito remite a una pregunta (`P-xx`) de [`preguntas-dueno.md`](preguntas-dueno.md).
> El estado de cada requisito en el sistema actual está en [`matriz-brechas.md`](matriz-brechas.md).

## Cómo leer este documento

- **Códigos:** `RF-xx` requisito funcional, `RN-xx` regla de negocio, `RNF-xx` requisito no funcional. Los códigos no se reutilizan: si un requisito se descarta, se marca como descartado.
- **Prioridad propuesta** (la confirma el dueño):
  - **I** · Imprescindible para empezar a usar el sistema en el local (MVP).
  - **D** · Deseable: aporta mucho, pero el local puede arrancar sin él.
  - **F** · Futuro: fuera de la primera entrega.
- **Validado:** `pendiente` hasta la reunión con el dueño; después, la fecha.

---

## 1. Requisitos funcionales

### 1.1 Mesas y espacio

| Código | Requisito | Fuente | Prioridad | Validado |
|--------|-----------|--------|:---------:|----------|
| RF-01 | El personal ve todas las mesas, filtradas por piso o en vista general, con su número, capacidad y estado (libre, ocupada o reservada) | E2, CU 1.4, IR | I | pendiente |
| RF-02 | Cada mesa tiene una capacidad mínima y máxima de personas | E2 | I | pendiente |
| RF-03 | El administrador crea, edita y desactiva mesas y pisos. Una mesa no puede tener un número repetido en su piso | CU 2.5 | I | pendiente |
| RF-04 | El administrador ubica cada mesa en el plano de su piso, sin que se superponga con otra (P-16) | CU 2.5 | D | pendiente |
| RF-05 | La mesa puede marcarse como "sucia" o "por limpiar" (P-16) | IR §3 | F | pendiente |
| RF-06 | Al abrir una orden en una mesa con una reserva activa, el sistema avisa al personal antes de continuar | CU 1.4, E1 | I | pendiente |

### 1.2 Órdenes

| Código | Requisito | Fuente | Prioridad | Validado |
|--------|-----------|--------|:---------:|----------|
| RF-07 | Al seleccionar una mesa libre se abre una orden nueva; si está ocupada, se muestra su orden abierta | CU 1.2 | I | pendiente |
| RF-08 | El personal agrega productos y juegos a la orden, cambia cantidades y quita ítems, y el total se recalcula en el momento | CU 1.2, E2 | I | pendiente |
| RF-09 | Cada ítem (producto o juego) admite un comentario opcional (ej. "sin cebolla") que se imprime en la comanda | E2, CU 1.2 | I | pendiente |
| RF-10 | Al tomar el pedido, el personal filtra por tipo (comida, bebida, juego) o zona de preparación, y busca por nombre | CU 1.2 | I | pendiente |
| RF-11 | El personal aplica un descuento a la orden (porcentaje o monto) con un **comentario obligatorio** que lo justifique (RN-06) | E2, CU 1.2 | I | pendiente |
| RF-12 | Una orden cerrada (cobrada) no se puede modificar | E2, CU 1.2 | I | pendiente |
| RF-13 | El sistema registra qué empleado abrió y qué empleado cobró cada orden | E2 (admin 10) | D | pendiente |

### 1.3 Comandas (cocina y cafetería)

| Código | Requisito | Fuente | Prioridad | Validado |
|--------|-----------|--------|:---------:|----------|
| RF-14 | Cada producto pertenece a una zona de preparación: **Cocina** o **Cafetería** (P-12) | E2, CU 1.3, CU 2.3 | I | pendiente |
| RF-15 | El personal imprime la comanda de una orden separada por zona, eligiendo qué productos y cuántas unidades, con un contador de lo ya impreso. No se puede imprimir sin seleccionar nada | CU 1.3, E2 | I | pendiente |
| RF-16 | Cocina y cafetería ven en una pantalla los pedidos pendientes y los marcan como listos, y el mesero ve el cambio (P-10) | IR §5.1, TW | D | pendiente |

### 1.4 Pagos y caja

| Código | Requisito | Fuente | Prioridad | Validado |
|--------|-----------|--------|:---------:|----------|
| RF-17 | El cajero cobra una orden en efectivo, por QR o combinando ambos | E2, CU 1.1, IR | I | pendiente |
| RF-18 | El cajero divide la cuenta entre varias personas, asignando a cada pago los ítems que le corresponden; la orden queda "pagada parcialmente" hasta completarse (P-02) | E1, CU 1.1, IR | I | pendiente |
| RF-19 | Cada pago puede llevar, de forma opcional, el CI o el nombre del cliente | E2, CU 1.1 | D | pendiente |
| RF-20 | El sistema avisa si el monto cobrado es mayor o menor al total, y calcula el vuelto en efectivo (P-02) | CU 1.1 | I | pendiente |
| RF-21 | La orden se cierra y la mesa se libera solo cuando lo pagado cubre el total (RN-07) | CU 1.1, TW | I | pendiente |
| RF-22 | El cajero abre la jornada y la cierra con su CI y contraseña. Al cerrar, el sistema guarda: total por método de pago, productos vendidos por tipo y categoría, número de órdenes, reservas del día y atrasos del personal. Después del cierre no se aceptan órdenes hasta la siguiente apertura (P-09) | CU 1.7, E1 | I | pendiente |
| RF-23 | Al abrir y cerrar la caja se registran el monto inicial y el final contado (arqueo), y el sistema muestra la diferencia con lo esperado (P-09) | E2 (caja 1), E1 | D | pendiente |
| RF-24 | El sistema emite facturas físicas o electrónicas (P-11) | E2, CU 1.1 | F | pendiente |

### 1.5 Reservas y clientes

| Código | Requisito | Fuente | Prioridad | Validado |
|--------|-----------|--------|:---------:|----------|
| RF-25 | El personal registra una reserva con nombre, CI o teléfono del cliente, mesa, fecha y hora y **cantidad de personas** | E2, CU 1.6 | I | pendiente |
| RF-26 | El sistema no permite dos reservas que se crucen en la misma mesa (RN-12) | E2, CU 1.6, TW | I | pendiente |
| RF-27 | El sistema no permite crear una reserva en una hora pasada | CU 1.6 | I | pendiente |
| RF-28 | El personal ve las reservas del día y de los próximos días, y puede modificarlas o cancelarlas. Una reserva cancelada queda registrada como cancelada, no se borra | CU 1.6 | I | pendiente |
| RF-29 | Si el cliente no llega dentro de la tolerancia (RN-02), la reserva expira sola y la mesa se libera | E1, E2 | I | pendiente |
| RF-30 | El sistema busca clientes por nombre o CI para no registrarlos dos veces | CU 1.6 | D | pendiente |

### 1.6 Productos

| Código | Requisito | Fuente | Prioridad | Validado |
|--------|-----------|--------|:---------:|----------|
| RF-31 | El administrador registra, edita y desactiva productos con nombre, precio, zona, categorías, estado e imagen opcional | E2, CU 2.3 | I | pendiente |
| RF-32 | Cada producto tiene un **costo** (precio de producción) para poder calcular la ganancia (P-12) | E2 (admin 5) | D | pendiente |
| RF-33 | El cajero y el administrador marcan un producto como **agotado** y lo vuelven a habilitar; un producto agotado no aparece al tomar pedidos (RN-08) | E2, CU 1.5 | I | pendiente |
| RF-34 | No se pueden registrar dos productos con el mismo nombre en la misma categoría y zona | CU 2.3 | D | pendiente |
| RF-35 | El administrador administra las categorías de productos y de juegos | E2 | I | pendiente |
| RF-36 | El administrador carga productos y juegos de forma masiva desde Excel *(no estaba en los requisitos originales; ya existe en el sistema y sirve para pasar los Excel actuales)* | — | D | pendiente |

### 1.7 Juegos

| Código | Requisito | Fuente | Prioridad | Validado |
|--------|-----------|--------|:---------:|----------|
| RF-37 | El administrador registra juegos con nombre, categorías, precio de préstamo, jugadores mínimo y máximo, tiempo estimado, edad mínima, tamaño y enlace a sus reglas en Drive (P-04) | E2, CU 3.1 | I | pendiente |
| RF-38 | El personal registra qué juegos se prestan a cada mesa, y el juego se cobra por préstamo (RN-04) | E1, DW | I | pendiente |
| RF-39 | El personal registra un juego **leyendo su código QR o de barras**, y el sistema muestra su nombre y precio (P-03) | E1 | D | pendiente |
| RF-40 | El cliente consulta el catálogo de juegos desde un QR, sin iniciar sesión: busca por nombre, filtra por categoría y ve jugadores, tiempo, edad mínima y el enlace a las reglas. Es solo de consulta (P-18) | E2, CU 3.1, IR | I | pendiente |

### 1.8 Empleados y asistencia

| Código | Requisito | Fuente | Prioridad | Validado |
|--------|-----------|--------|:---------:|----------|
| RF-41 | El administrador registra, edita y desactiva empleados con nombre, CI, dirección, teléfono, correo y **un único rol**. El CI no se repite y se valida el formato de teléfono y correo. Un empleado desactivado no puede entrar al sistema | E2, CU 2.2 | I | pendiente |
| RF-42 | El administrador define el horario de cada empleado por día (entrada y salida) | IR, CU 1.8 | I | pendiente |
| RF-43 | El empleado registra su llegada con su CI y contraseña; queda **pendiente** hasta que un usuario autorizado la confirme con su propio login. Solo se admite una llegada por empleado y por día (RN-10) | CU 1.8, IR | I | pendiente |
| RF-44 | El **servidor** calcula el atraso contra el horario y asigna el descuento según la tabla (RN-01) | E2, CU 1.8 | I | pendiente |
| RF-45 | El administrador registra el sueldo base de cada empleado y ve el sueldo neto del mes (sueldo − descuentos por atraso). Al empezar un mes, los descuentos se reinician y el mes anterior queda en el historial (P-08) | E2 (admin 3), CU 2.6 | D | pendiente |

### 1.9 Reportes

| Código | Requisito | Fuente | Prioridad | Validado |
|--------|-----------|--------|:---------:|----------|
| RF-46 | El administrador consulta reportes por día, semana, mes o un rango, con atajos (hoy, ayer, esta semana, semana anterior, este mes) | E2, CU 2.4 | I | pendiente |
| RF-47 | El reporte muestra: ingresos por método de pago, número de órdenes, productos y juegos más vendidos, mesas ocupadas, reservas, y atrasos con su descuento | E2, CU 2.4 | I | pendiente |
| RF-48 | El reporte muestra la **ganancia** (ingresos − costo de lo vendido) (depende de RF-32) | E2 | D | pendiente |
| RF-49 | El reporte lista los descuentos aplicados a órdenes con su comentario y quién los aplicó | E2 | D | pendiente |
| RF-50 | El administrador ve las operaciones de cada empleado: órdenes, montos y método de pago (depende de RF-13) | E2 (admin 10) | D | pendiente |
| RF-51 | Los reportes y gráficas solo los ve el administrador | E2 | I | pendiente |

### 1.10 Seguridad y auditoría

| Código | Requisito | Fuente | Prioridad | Validado |
|--------|-----------|--------|:---------:|----------|
| RF-52 | Cada usuario entra con CI y contraseña, y el **servidor** solo le permite las acciones de su rol (matriz de permisos por definir en la Etapa 2) | E2, IR | I | pendiente |
| RF-53 | El sistema guarda una bitácora de quién cambió qué: precios y productos, órdenes, descuentos y asistencia (P-19) | E2 | D | pendiente |
| RF-54 | La base de datos se respalda de forma automática; el administrador ve la fecha del último respaldo y puede lanzar uno a mano (P-14) | E2 (admin 11) | I | pendiente |

---

## 2. Reglas de negocio

| Código | Regla | Fuente | Estado |
|--------|-------|--------|--------|
| RN-01 | **Descuento por atraso** (sobre el salario): hasta 5 min, sin descuento; 10 min, −10 % del salario diario; 20 min, −20 % del salario diario; 1 hora o más, −1 % mensual por cada hora | E2, CU 1.8 | ⚠ Incompleta: no dice qué pasa entre 6 y 9 min ni entre 21 y 59, ni cómo se calcula "−1 % mensual por hora". El seed del sistema usa otra regla (15 min → 10). Ver P-07 |
| RN-02 | **Tolerancia de reserva:** si el cliente no llega en **30 minutos**, la mesa se libera | E1, E2 | ⚠ El sistema usa 20 min por defecto (`minutos_tolerancia`). Confirmar en P-05 |
| RN-03 | Las reservas no tienen costo. Llegan por WhatsApp y **siempre las registra el personal**: el cliente no tiene acceso al sistema interno | E1, E2 | pendiente |
| RN-04 | Los juegos se cobran **por préstamo** (precio fijo por juego), **no por tiempo** | E1, DW | pendiente. Confirmar si el precio depende del tamaño del juego (P-04) |
| RN-05 | El cobro se hace al final del servicio | E1 | pendiente |
| RN-06 | Todo descuento a una orden necesita un comentario justificativo. **Quién puede aplicarlo y con qué límite** no está definido | E2, CU 1.2 | ⚠ Falta el dato. Ver P-06 |
| RN-07 | La orden solo se cierra cuando lo pagado cubre el total | CU 1.1, TW | ⚠ Falta definir la tolerancia de redondeo: el sistema tiene dos (0.01 Bs y 0.5 Bs). Ver P-02 |
| RN-08 | Un producto agotado no se puede vender hasta que vuelva a marcarse como disponible | CU 1.5 | pendiente |
| RN-09 | Empleados, productos, juegos y mesas no se borran: se desactivan y quedan en la base de datos | CU 2.2, CU 2.3, CU 2.5 | pendiente |
| RN-10 | La llegada de un empleado la confirma un **cajero, mozo o administrador** distinto de él | CU 1.8 | ⚠ El sistema solo deja confirmar a ADMIN y CAJERO. Ver P-07 |
| RN-11 | Los descuentos por atraso se acumulan por mes; al empezar un mes se reinician y el anterior queda en el historial | CU 2.6 | pendiente |
| RN-12 | Una mesa reservada queda bloqueada un tiempo antes y después de la hora de la reserva | TW | ⚠ El valor (±120 min) lo puso el equipo, no el negocio. Ver P-05 |
| RN-13 | El catálogo de juegos para clientes muestra **todos** los juegos registrados, activos o no | CU 3.1 | ⚠ Raro para un cliente (¿ver juegos que no se pueden pedir?). Ver P-18 |

---

## 3. Requisitos no funcionales

| Código | Requisito | Fuente | Nota |
|--------|-----------|--------|------|
| RNF-01 | El sistema funciona en una **PC del local**, accesible desde los dispositivos del personal por la red WiFi del local | Decisión 24/11/2026 | Reemplaza lo que decía IR §6.3 (nube / Supabase). El paso a la nube se evalúa en la Etapa 9 |
| RNF-02 | El sistema está disponible durante todo el horario de atención. Si la PC se reinicia, el sistema vuelve a arrancar solo | IR §5.2 (adaptado) | IR pedía "24/7 con 99.9 %", que no aplica a un servidor local |
| RNF-03 | La interfaz del mesero funciona en celular y tablet: botones grandes y flujos cortos | IR §5.2 | |
| RNF-04 | Un cambio de estado en cocina o cafetería se ve en la pantalla del mesero en menos de **2 segundos** | IR §5.2 | Hoy el refresco es cada 30 s. Confirmar si es necesario (P-10) |
| RNF-05 | Fechas y horas en la zona horaria de Bolivia (UTC-4) en todo el sistema | Análisis §4.6 | |
| RNF-06 | Las contraseñas se guardan con hash; nunca se muestran ni se registran en logs | TW25 | |
| RNF-07 | Un respaldo se puede **restaurar**, y la restauración se prueba al menos una vez antes de la entrega | — | Complementa RF-54 |
| RNF-08 | La API sirve a dos clientes: la web y la app Android de meseros. Responde con errores y códigos HTTP consistentes y está documentada | Decisión 24/11/2026 | |
| RNF-09 | Toda la interfaz está en español; accesibilidad básica (etiquetas en los campos, uso con teclado) | Análisis §12.3 | |
| RNF-10 | Cualquier persona puede instalar el sistema siguiendo la guía de `docs/04_implementacion/` | — | Necesario para mantenerlo después de la entrega |

---

## 4. Fuera de alcance (primera entrega)

| Tema | Motivo |
|------|--------|
| Power BI / Data Warehouse | Trabajo académico (SIS-226), no lo pidió el negocio para operar |
| Proveedores, compras e inventario de cocina (stock) | Excluido en DW. IR §5.1 hablaba de "validar stock", pero el negocio no lleva inventario: se usa el estado "agotado" (RF-33) |
| Facturación electrónica | El negocio no factura (E1). Queda como RF-24, prioridad F |
| Reservas hechas por el propio cliente | RN-03: las registra el personal. CU del TECII ("Solicitar reserva de mesa" por el cliente) se descarta salvo que el dueño diga lo contrario |
| Calificaciones, ruleta, "dragomonedas" | Ideas sueltas de la entrevista, no requisitos (P-17) |

## Historial

| Versión | Fecha | Cambio |
|---------|-------|--------|
| 0.1 | 24/11/2026 | Primera versión reconstruida desde los documentos del equipo (issue #4) |
