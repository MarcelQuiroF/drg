# Requisitos de DRG – Mesa Dragón

> **Versión 0.2 · 25/11/2026 · Estado: revisado por Marcelo; pendiente de validar con el dueño (presentación del MVP, 10/12/2026).**
> Reconstruidos a partir de los documentos del equipo original (ver [Fuentes en el contexto del negocio](../01_negocio/contexto.md#fuentes)). Se reescribieron para que cada requisito sea **uno solo, verificable y con su fuente**. Donde los documentos se contradicen o falta un dato, el requisito remite a una pregunta (`P-xx`) de [`preguntas-dueno.md`](preguntas-dueno.md).
> El estado de cada requisito en el sistema actual está en [`matriz-brechas.md`](matriz-brechas.md).

## Cómo leer este documento

- **Códigos:** `RF-xx` requisito funcional, `RN-xx` regla de negocio, `RNF-xx` requisito no funcional. Los códigos no se reutilizan: si un requisito se descarta, se marca como descartado.
- **Prioridad propuesta** (la confirma el dueño):
  - **I** · Imprescindible para empezar a usar el sistema en el local (MVP).
  - **D** · Deseable: aporta mucho, pero el local puede arrancar sin él.
  - **F** · Futuro: fuera de la primera entrega.
- **Validado:**
  - `Marcelo 25/11` · lo confirmó Marcelo, que conoce la operación del local. Se vuelve a confirmar con el dueño el 10/12.
  - `prueba` · valor provisional, para poder desarrollar y probar. Se cambia cuando el dueño responda.
  - `pendiente` · todavía sin respuesta.
  - `descartado` · no se hará. El código no se reutiliza.

---

## 1. Requisitos funcionales

### 1.1 Mesas y espacio

| Código | Requisito | Fuente | Prioridad | Validado |
|--------|-----------|--------|:---------:|----------|
| RF-01 | El personal ve todas las mesas como tarjetas, filtradas por piso o en vista general, con su número, capacidad y estado (libre, ocupada o reservada) | E2, CU 1.4, IR, M1 | I | Marcelo 25/11 |
| RF-02 | Cada mesa tiene una capacidad mínima y máxima de personas | E2 | I | pendiente |
| RF-03 | El administrador crea, edita y desactiva mesas y pisos. Una mesa no puede tener un número repetido en su piso | CU 2.5 | I | pendiente |
| ~~RF-04~~ | ~~El administrador ubica cada mesa en el plano de su piso~~. **Descartado:** la vista de mesas como tarjetas ya fue aceptada en un semestre anterior; no hace falta un plano | CU 2.5, M1 | — | descartado |
| ~~RF-05~~ | ~~La mesa puede marcarse como "sucia"~~. **Descartado:** no se usa en el local | IR §3, M1 | — | descartado |
| RF-06 | Al abrir una orden en una mesa con una reserva activa, el sistema avisa al personal antes de continuar | CU 1.4, E1 | I | pendiente |
| RF-55 | El personal **mueve una orden abierta a otra mesa libre**, con todos sus ítems y pagos parciales; la mesa de origen queda libre. Caso típico: un grupo chico ocupa una mesa grande, el local se llena y llega un grupo grande | M1 | I | Marcelo 25/11 |

### 1.2 Órdenes

| Código | Requisito | Fuente | Prioridad | Validado |
|--------|-----------|--------|:---------:|----------|
| RF-07 | Al seleccionar una mesa libre se abre una orden nueva; si está ocupada, se muestra su orden abierta | CU 1.2 | I | pendiente |
| RF-08 | El personal agrega productos y juegos a la orden, cambia cantidades y quita ítems, y el total se recalcula en el momento | CU 1.2, E2 | I | pendiente |
| RF-09 | Cada ítem (producto o juego) admite un comentario opcional (ej. "sin cebolla") que se imprime en la comanda | E2, CU 1.2 | I | pendiente |
| RF-10 | Al tomar el pedido, el personal filtra por tipo (comida, bebida, juego) o zona de preparación, y busca por nombre | CU 1.2 | I | pendiente |
| RF-11 | El cajero o el mesero aplica un descuento a la orden (porcentaje o monto) con un **comentario obligatorio** que lo justifique, sin tope y sin pedir autorización (RN-06) | E2, CU 1.2, M1 | I | Marcelo 25/11 |
| RF-12 | Una orden cerrada (cobrada) no se puede modificar | E2, CU 1.2 | I | pendiente |
| RF-13 | El sistema registra qué empleado abrió y qué empleado cobró cada orden | E2 (admin 10) | D | pendiente |

### 1.3 Comandas (cocina y cafetería)

| Código | Requisito | Fuente | Prioridad | Validado |
|--------|-----------|--------|:---------:|----------|
| RF-14 | Cada producto pertenece a una zona de preparación: **Cocina** o **Cafetería** (P-12) | E2, CU 1.3, CU 2.3 | I | prueba |
| RF-15 | El personal imprime la comanda de una orden separada por zona, eligiendo qué productos y cuántas unidades, con un contador de lo ya impreso. No se puede imprimir sin seleccionar nada. Cocina y cafetería **solo reciben la comanda impresa** | CU 1.3, E2, M1 | I | Marcelo 25/11 |
| ~~RF-16~~ | ~~Cocina y cafetería ven los pedidos en una pantalla~~. **Descartado:** solo usan comanda impresa. Si el mesero necesita ver al instante cuándo un pedido está listo sigue pendiente (P-10, RNF-04) | IR §5.1, TW, M1 | — | descartado |

### 1.4 Pagos y caja

| Código | Requisito | Fuente | Prioridad | Validado |
|--------|-----------|--------|:---------:|----------|
| RF-17 | El cajero cobra una orden en efectivo, por QR o combinando ambos | E2, CU 1.1, IR | I | pendiente |
| RF-18 | El cajero divide la cuenta entre varias personas, **por ítems** (cada uno paga lo que consumió) **o por monto**; la orden queda "pagada parcialmente" hasta completarse. Una misma persona puede pagar parte en efectivo y parte por QR | E1, CU 1.1, IR, M1 | I | Marcelo 25/11 |
| RF-19 | Cada pago puede llevar, de forma opcional, el CI o el nombre del cliente | E2, CU 1.1 | D | pendiente |
| RF-20 | El sistema avisa si lo cobrado no alcanza o supera el total, y calcula el vuelto de los pagos en efectivo. Un pago QR mayor al total **no se registra en el sistema**: la diferencia se devuelve aparte y se registra solo el monto que corresponde | CU 1.1, M1 | I | Marcelo 25/11 |
| RF-21 | La orden se cierra y la mesa se libera solo cuando lo pagado cubre el total (RN-07) | CU 1.1, TW | I | pendiente |
| RF-22 | Un cajero abre la jornada y un cajero la cierra (no tiene que ser el mismo), con su CI y contraseña. Al cerrar, el sistema guarda un resumen del día (contenido por definir, P-09). Después del cierre no se aceptan órdenes hasta la siguiente apertura | CU 1.7, E1, M1 | I | Marcelo 25/11 (contenido del resumen: pendiente) |
| RF-56 | Un día cerrado se puede **reabrir** para corregir un error humano (por ejemplo, llega un cliente después del cierre); la reapertura queda registrada con quién y por qué. Quién puede reabrir está pendiente (P-09); valor de prueba: el administrador | M1 | I | Marcelo 25/11 · quién: prueba |
| RF-23 | Al abrir y cerrar la caja se registran el monto inicial y el final contado (arqueo), y el sistema muestra la diferencia con lo esperado (P-09) | E2 (caja 1), E1 | D | pendiente |
| RF-24 | El sistema emite facturas físicas o electrónicas. **Totalmente fuera de la primera entrega** | E2, CU 1.1, M1 | F | Marcelo 25/11 |

### 1.5 Reservas y clientes

| Código | Requisito | Fuente | Prioridad | Validado |
|--------|-----------|--------|:---------:|----------|
| RF-25 | El personal registra una reserva con nombre, CI o teléfono del cliente, mesa, fecha y hora. La **cantidad de personas** se pide siempre, aunque puede quedar vacía; sirve para los reportes | E2, CU 1.6, M1 | I | Marcelo 25/11 |
| RF-26 | El sistema no permite dos reservas que se crucen en la misma mesa (RN-12) | E2, CU 1.6, TW | I | pendiente |
| RF-27 | El sistema no permite crear una reserva en una hora pasada | CU 1.6 | I | pendiente |
| RF-28 | El personal ve las reservas del día y de los próximos días, y puede modificarlas o cancelarlas. Una reserva cancelada queda registrada como cancelada, no se borra | CU 1.6 | I | pendiente |
| RF-29 | Si el cliente no llega dentro de la tolerancia (RN-02), la reserva expira sola y la mesa se libera | E1, E2, M1 | I | Marcelo 25/11 |
| RF-30 | El sistema busca clientes por nombre o CI para no registrarlos dos veces | CU 1.6 | D | pendiente |

### 1.6 Productos

| Código | Requisito | Fuente | Prioridad | Validado |
|--------|-----------|--------|:---------:|----------|
| RF-31 | El administrador registra, edita y desactiva productos con nombre, precio, zona, categorías, estado e imagen opcional | E2, CU 2.3 | I | pendiente |
| RF-32 | Cada producto puede tener un **costo** (precio de producción), **opcional**, para calcular la ganancia | E2 (admin 5), M1 | D | Marcelo 25/11 |
| RF-33 | Un usuario autorizado marca un producto como **agotado** y lo vuelve a habilitar; un producto agotado no aparece al tomar pedidos (RN-08). Quién puede hacerlo está pendiente (P-12) | E2, CU 1.5 | I | pendiente |
| RF-34 | No se pueden registrar dos productos con el mismo nombre en la misma categoría y zona | CU 2.3 | D | pendiente |
| RF-35 | El administrador administra las categorías de productos y de juegos | E2 | I | pendiente |
| RF-36 | El administrador carga productos y juegos de forma masiva desde Excel *(no estaba en los requisitos originales; ya existe en el sistema y sirve para pasar los Excel actuales)* | — | D | pendiente |

### 1.7 Juegos

| Código | Requisito | Fuente | Prioridad | Validado |
|--------|-----------|--------|:---------:|----------|
| RF-37 | El administrador registra juegos con nombre, categorías, **tamaño**, jugadores mínimo y máximo, tiempo estimado, edad mínima y enlace a sus reglas en Drive. El precio del préstamo sale del tamaño (RF-57) | E2, CU 3.1, M1 | I | Marcelo 25/11 |
| RF-57 | El administrador define los **tamaños** de juego (por ejemplo chico, mediano, grande), cada uno con su precio de préstamo y el color de su etiqueta en el local. Al cambiar el precio de un tamaño, cambia el de todos sus juegos (para las órdenes nuevas) | M1 | I | Marcelo 25/11 |
| RF-38 | El personal registra en la mesa cada juego que se presta, aunque devuelvan uno y saquen otro, y cada préstamo se cobra (RN-04) | E1, DW, M1 | I | Marcelo 25/11 |
| RF-39 | Al cobrar, el personal registra cada juego **leyendo su código con un lector** (como hoy se anota en el Excel cuando el cliente lo devuelve): el juego se agrega a la orden de la mesa y queda registrado que salió del estante y que volvió. Hoy cada juego lleva una etiqueta de color según su precio, así que es de **prioridad baja** | E1, M1 | F | Marcelo 25/11 |
| RF-40 | El cliente consulta el catálogo de juegos desde un QR, sin iniciar sesión: busca por nombre, filtra por categoría y ve jugadores, tiempo, edad mínima y el enlace a las reglas. Es solo de consulta (P-18) | E2, CU 3.1, IR | I | pendiente |

### 1.8 Empleados y asistencia

| Código | Requisito | Fuente | Prioridad | Validado |
|--------|-----------|--------|:---------:|----------|
| RF-41 | El administrador registra, edita y desactiva empleados con nombre, CI, dirección, teléfono, correo y **un único rol**. El CI no se repite y se valida el formato de teléfono y correo. Un empleado desactivado no puede entrar al sistema | E2, CU 2.2 | I | pendiente |
| RF-42 | El administrador define el horario de cada empleado por día, con hora de entrada y de salida. Cada empleado tiene su propio horario | IR, CU 1.8, M1 | I | Marcelo 25/11 |
| RF-43 | El empleado registra su llegada con su CI y contraseña; queda **pendiente** hasta que un usuario autorizado la confirme con su propio login. Solo se admite una llegada por empleado y por día (RN-10) | CU 1.8, IR | I | Marcelo 25/11 · quién confirma: prueba |
| RF-44 | El **servidor** calcula el atraso contra el horario y asigna el descuento según la tabla (RN-01) | E2, CU 1.8, M1 | I | Marcelo 25/11 |
| RF-45 | El administrador ve, por empleado y por mes, los atrasos y el **porcentaje acumulado** de descuento sobre el pago diario. El sueldo se calcula fuera del sistema. Al empezar un mes se reinicia el acumulado y el mes anterior queda en el historial (P-08) | E2 (admin 3), CU 2.6, M1 | D | prueba |

### 1.9 Reportes

| Código | Requisito | Fuente | Prioridad | Validado |
|--------|-----------|--------|:---------:|----------|
| RF-46 | El administrador consulta reportes por día, semana, mes o un rango, con atajos (hoy, ayer, esta semana, semana anterior, este mes) | E2, CU 2.4 | I | pendiente |
| RF-47 | El reporte muestra: ingresos por método de pago, número de órdenes, productos y juegos más vendidos, mesas ocupadas, reservas, y atrasos con su descuento | E2, CU 2.4 | I | pendiente |
| RF-48 | El reporte muestra la **ganancia** (ingresos − costo de lo vendido) (depende de RF-32) | E2 | D | pendiente |
| RF-49 | El administrador tiene una sección con **todos los descuentos** aplicados a órdenes: fecha, orden, monto, motivo y quién lo aplicó. Es el control de los descuentos, ya que no tienen tope ni autorización (RN-06) | E2, M1 | I | Marcelo 25/11 |
| RF-50 | El administrador ve las operaciones de cada empleado: órdenes, montos y método de pago (depende de RF-13) | E2 (admin 10) | D | pendiente |
| RF-51 | Los reportes y gráficas solo los ve el administrador | E2 | I | pendiente |

### 1.10 Seguridad y auditoría

| Código | Requisito | Fuente | Prioridad | Validado |
|--------|-----------|--------|:---------:|----------|
| RF-52 | Cada usuario entra con CI y contraseña, y el **servidor** solo le permite las acciones de su rol (matriz de permisos en [`permisos.md`](../03_diseno/permisos.md)) | E2, IR | I | pendiente |
| RF-53 | El sistema guarda una bitácora de quién cambió qué: precios y productos, órdenes, descuentos y asistencia (P-19) | E2 | D | pendiente |
| RF-54 | La base de datos se respalda de forma automática; el administrador ve la fecha del último respaldo y puede lanzar uno a mano (P-14) | E2 (admin 11) | I | pendiente |

---

## 2. Reglas de negocio

| Código | Regla | Fuente | Estado |
|--------|-------|--------|--------|
| RN-01 | **Descuento por atraso, sobre el pago diario.** Se aplica desde que se cruza cada umbral: menos de 10 min, sin descuento; desde 10 min, −10 %; desde 20 min, −20 %; más de 25 min, **no se paga el día** (−100 %) | M1 (audio del 24/11/2026) | Marcelo 25/11. **Reemplaza** la tabla de E2 y CU 1.8 (5/10/20/60 min), que ya no está vigente. El seed del sistema (15 min → 10) también está mal |
| RN-02 | **Tolerancia de reserva:** si el cliente no llega en **30 minutos**, la mesa se libera | E1, E2, M1 | Marcelo 25/11. ⚠ El sistema usa 20 min por defecto (`minutos_tolerancia`): hay que cambiarlo |
| RN-03 | Las reservas no tienen costo. Llegan por WhatsApp y **siempre las registra el personal**: el cliente no tiene acceso al sistema interno | E1, E2 | pendiente |
| RN-04 | Los juegos se cobran **por préstamo, no por tiempo**. El precio depende del **tamaño** del juego (RF-57). Cada juego prestado se cobra: si una mesa saca dos juegos, paga dos | E1, DW, M1 | Marcelo 25/11 |
| RN-05 | El cobro se hace al final del servicio | E1 | pendiente |
| RN-06 | Todo descuento a una orden necesita un **comentario** con el motivo (los habituales: cumpleaños, comida entregada por error). Lo aplican el **cajero o el mesero**, **sin tope y sin doble verificación**. El control se hace después, en la sección de descuentos del administrador (RF-49) | E2, CU 1.2, M1 | Marcelo 25/11 |
| RN-07 | La orden solo se cierra cuando lo pagado cubre el total, con una **tolerancia de redondeo de 0.50 Bs** | CU 1.1, TW, M1 | Marcelo 25/11. ⚠ El sistema tiene dos tolerancias (0.01 Bs y 0.50 Bs): queda una sola |
| RN-08 | Un producto agotado no se puede vender hasta que vuelva a marcarse como disponible | CU 1.5 | pendiente |
| RN-09 | Empleados, productos, juegos y mesas no se borran: se desactivan y quedan en la base de datos | CU 2.2, CU 2.3, CU 2.5 | pendiente |
| RN-10 | La llegada de un empleado la confirma otro usuario con su propio login. Valor de prueba: **el cajero** (y el administrador) | CU 1.8, M1 | prueba (P-07). El sistema ya permite ADMIN y CAJERO |
| RN-11 | Los descuentos por atraso se acumulan por mes; al empezar un mes se reinician y el anterior queda en el historial | CU 2.6 | prueba (P-08) |
| RN-12 | Una mesa reservada no se da a otros clientes desde **1 hora antes** de la reserva, y dos reservas de la misma mesa tienen que estar separadas al menos **2 horas** (un grupo se queda entre 1 y 2 horas) | TW, M1 | prueba (P-05). Hoy el sistema bloquea ±120 min |
| RN-13 | El catálogo de juegos para clientes muestra **todos** los juegos registrados, activos o no | CU 3.1 | ⚠ Raro para un cliente (¿ver juegos que no se pueden pedir?). Ver P-18 |
| RN-14 | El personal no registra en el sistema un pago QR mayor al total: devuelve la diferencia y registra solo el monto que corresponde | M1 | Marcelo 25/11 |
| RN-15 | La mesa de destino de una orden movida tiene que estar libre y no tener una reserva próxima (RN-12) | M1 | Marcelo 25/11 |

---

## 3. Requisitos no funcionales

| Código | Requisito | Fuente | Nota |
|--------|-----------|--------|------|
| RNF-01 | El sistema funciona en una **PC del local**, accesible desde los dispositivos del personal por la red WiFi del local | Decisión 24/11/2026 | Reemplaza lo que decía IR §6.3 (nube / Supabase). El paso a la nube se evalúa en la Etapa 9 |
| RNF-02 | El sistema está disponible durante todo el horario de atención. Si la PC se reinicia, el sistema vuelve a arrancar solo | IR §5.2 (adaptado) | IR pedía "24/7 con 99.9 %", que no aplica a un servidor local |
| RNF-03 | La interfaz del mesero funciona en celular y tablet: botones grandes y flujos cortos | IR §5.2 | |
| RNF-04 | Un cambio de estado en cocina o cafetería se ve en la pantalla del mesero en menos de **2 segundos** | IR §5.2 | pendiente (P-10). Cocina y cafetería no usan pantalla (RF-16 descartado), así que quizá no aplica. Hoy el refresco es cada 30 s |
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
| Facturación | El negocio no factura (E1). Confirmado: totalmente fuera de la primera entrega (RF-24) |
| Reservas hechas por el propio cliente | RN-03: las registra el personal. CU del TECII ("Solicitar reserva de mesa" por el cliente) se descarta salvo que el dueño diga lo contrario |
| Calificaciones, ruleta, "dragomonedas" | Ideas sueltas de la entrevista, no requisitos (P-17) |

## Historial

| Versión | Fecha | Cambio |
|---------|-------|--------|
| 0.1 | 24/11/2026 | Primera versión reconstruida desde los documentos del equipo (issue #4) |
| 0.2 | 25/11/2026 | Respuestas de Marcelo (fuente M1): nueva tabla de atrasos (RN-01), tamaños de juego (RF-57), mover órdenes (RF-55), reabrir el día (RF-56), descuentos sin tope (RN-06); descartados RF-04, RF-05 y RF-16 |
