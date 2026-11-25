# Contexto del negocio

> Reconstruido el 24/11/2026 a partir de los documentos del equipo original (2025–2026) y revisado por Marcelo el 25/11/2026. Se valida con el dueño en la presentación del MVP (10/12/2026): lo que diga el dueño tiene prioridad sobre este documento.
> Las fuentes se citan con los códigos de la sección [Fuentes](#fuentes).

## 1. El negocio

**Mesa Dragón Café Lúdico** es un local en Tarija que combina una **cafetería** con una **ludoteca** (préstamo de juegos de mesa). El dueño lo fundó solo hace unos años [E1].

- El atractivo es el juego, pero **lo que más ingresos deja es la comida** [E1].
- La idea del local es ofrecer una experiencia distinta a "salir a tomar": la gente viene a jugar unas horas y, mientras juega, pide de comer [E1].
- Los juegos **se cobran por préstamo, no por tiempo**. El precio depende del tamaño del juego, y cada caja lleva una etiqueta de color según su precio [E1, DW, M1].
- El cobro se hace **al final** del servicio, en efectivo o por QR [E1, NEG].
- Las reservas llegan por **WhatsApp**, no tienen costo y la mesa se guarda **media hora**; si el cliente no llega, se libera [E1].
- **No emiten factura** [E1].
- Horarios de más clientes (estimados "a ojo"): después de la oficina, de 20:00 en adelante, y casi todo el día los fines de semana [E1].

## 2. Cómo trabaja hoy

Todo se lleva con **planillas de Excel** (algunas con macros y botones) y papel [E1, NEG]:

1. El cliente llega a la caja, elige mesa y juego. Si hace falta, el instructor le explica las reglas.
2. Desde la mesa ve un QR con el menú y el WiFi.
3. Los pedidos se dictan en el mostrador. Se cargan en un Excel por cantidades, se **imprimen** y se llevan a la cocina o a la cafetería, según el producto.
4. En otro Excel se va anotando lo que consume cada mesa. Los juegos se anotan en un tercer Excel **cuando el cliente devuelve el juego**.
5. Al final, en el Excel "final" solo queda el **monto total por mesa**.
6. El cliente paga en efectivo y/o QR; el recepcionista lo comprueba.

Además, la administración lleva en Excel las compras, los ingresos y los egresos [E1].

## 3. Personas y roles

| Rol en el local | Qué hace | Rol en el sistema actual |
|-----------------|----------|--------------------------|
| Dueño / administrador | Configura el negocio, ve los reportes semanales y mensuales, quiere ampliar su Excel administrativo | `ADMIN` |
| Instructor de juegos y cajero ("el profe") | Atiende la caja, explica los juegos, hace el arqueo y **cierra el día** | `CAJERO` |
| Chef | Prepara la comida (cocina) | — |
| Encargado de cafetería (barista) | Recibe solo los pedidos que le corresponden | — |
| Mesera / recepcionista (fines de semana) | Toma pedidos y los entrega; en el sistema solo ve el mapa de mesas | `MESERO` |
| Cliente | Consulta el catálogo de juegos por QR. Nunca usa el sistema interno: sus pedidos y reservas los registra el personal | Catálogo público |

Fuentes: [E1, E2, DW]. Los roles de cocina y cafetería aparecen en los documentos (como "Chef", "Barista" o "Cocina"), pero el sistema no los tiene. Ver la pregunta P-10 en [`preguntas-dueno.md`](../02_requisitos/preguntas-dueno.md).

## 4. Problemas que el sistema tiene que resolver

1. **Se pierde el detalle de las ventas.** Solo se guarda el total por mesa, así que no se sabe qué productos o juegos venden más, ni cuáles son las horas pico con datos reales [NEG, TW].
2. **Errores de cobro.** Los totales se suman a mano entre varios Excel, y la **cuenta individual** es la única complicación que el dueño mencionó ("uno quiere pagar solo su hamburguesa y su juego") [E1, IR].
3. **No hay control para auditar.** Sin registro detallado no se puede revisar un cierre de caja ni detectar pérdidas [NEG].
4. **Control de los juegos.** Es lo que el dueño ve **más necesario**: hoy el cajero puede no saber el precio de un juego. Propuso etiquetar los juegos con código de barras o QR para leerlos y obtener título y precio al instante [E1].
5. **Falta de personal para explicar juegos.** Es la tarea que más tiempo consume, y mientras el instructor explica, nadie más atiende la caja [E1]. *(No es algo que el software resuelva directamente, pero agilizar el registro libera tiempo.)*
6. **Asistencia y atrasos del personal** se controlan a mano [E2, IR].

## 5. Objetivos del sistema

- Un **sistema único** para pedidos, pagos, reservas, asistencia y caja, que reemplace los Excel dispersos [E2, IR].
- **Menos errores** en pedidos, descuentos y cobros, con cálculo automático de totales [E2].
- **Menos tiempo** del personal en tareas repetitivas: llevar pedidos a cocina, sumar cuentas, controlar asistencia [E2, IR].
- Ver **el estado de cada mesa** en todo momento sin recorrer el local [IR].
- **Reportes** diarios, semanales y mensuales de ingresos, productos y personal para que el dueño decida con datos [E2, DW].

## 6. Fuera del alcance de la entrega

- **Power BI / Data Warehouse:** fue un trabajo académico (materia SIS-226). Los reportes del negocio los cubre el dashboard del panel de administración.
- **Proveedores, compras e inventario de cocina** [DW: excluido]. El dueño hoy lo maneja en Excel.
- **Facturación electrónica:** el negocio no factura. Se deja como mejora futura (ver P-11).
- Ideas mencionadas pero no pedidas: ruleta, calificaciones de clientes, "dragomonedas" (ver P-17).

## Fuentes

| Código | Documento (Drive del equipo) | Fecha | Qué es |
|--------|------------------------------|-------|--------|
| E1 | `Sistema trans mesa dragon` (y sus copias) | ago–sep 2025 | **Notas crudas de la primera entrevista con el dueño.** La fuente más directa |
| E2 | `Entrevista DRG.pdf` | oct 2025 | Requerimientos de negocio, de usuario y funcionales (materia SIS-225) |
| CU | `Casos de uso extendido.docx` | 2025 | 15 casos de uso extendidos |
| IR | `DRG - INGENIERÍA DE REQUERIMIENTOS.docx` | nov 2025 | Documento que integra modelado del negocio, requisitos y casos de uso |
| TW25 | `DRG` (documento) | nov 2025 | Descripción técnica del backend |
| NEG | `Bussines`, `TECII_MESA DRAGON` | 2026 | Situación actual, flujo de trabajo y de datos, problema y solución |
| DW | `Entregable DRG`, `Documento del proyecto V1/V2`, `Planificacion de proyecto`, `Para power BI` | 2026 | Proyecto de Data Warehouse (SIS-226): incluye necesidades de información del dueño |
| TW | `TW.mp4` | may 2026 | Video de presentación del sistema |
| M1 | Respuestas de Marcelo Quiroga a las preguntas para el dueño, incluido un audio sobre los descuentos por atraso | 25/11/2026 | Marcelo conoce la operación del local; sus respuestas se vuelven a confirmar con el dueño en la presentación del MVP (10/12/2026) |
