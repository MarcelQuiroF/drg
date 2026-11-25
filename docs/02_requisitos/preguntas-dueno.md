# Preguntas para el dueño

> **Para validar el alcance.** Preparadas el 24/11/2026. El 25/11/2026 Marcelo respondió las que conoce (ver [Respuestas](#respuestas)); el resto queda para la **presentación del MVP al dueño, el 10/12/2026** (ver [Pendientes para el 10/12](#pendientes-para-el-1012)).
> Cada pregunta dice **por qué importa** y, cuando hay una, **la propuesta por defecto**: si el dueño no tiene una preferencia, se usa esa. Las respuestas se anotan aquí mismo, con la fecha, y después se actualizan [`requisitos.md`](requisitos.md) y la [matriz de brechas](matriz-brechas.md).

## Cómo usar esta lista en la reunión

- **Duración sugerida:** 45–60 minutos. Si no alcanza el tiempo, el bloque A es el mínimo.
- Llevar el sistema funcionando (aunque sea en una laptop) para mostrar cada pantalla al preguntar: es más fácil opinar sobre algo que se ve.
- Al final, leer en voz alta la lista de lo **imprescindible** y confirmar que está de acuerdo. Eso es el alcance de la entrega.

---

## A. Alcance y prioridades (lo mínimo de la reunión)

**P-01 · ¿Qué tiene que hacer el sistema, sí o sí, para empezar a usarlo en el local?**
Mostrarle la lista de requisitos marcados como **I** (imprescindibles) y pedirle que tache, agregue o reordene.
*Por qué:* define el MVP. Sin esto no se puede ordenar el backlog de la Etapa 2.

**P-02 · Cuenta individual: ¿cómo se divide la cuenta hoy?**
- ¿Cada persona paga **lo que consumió** (elige sus ítems) o se divide **en partes iguales**, o pasan las dos cosas?
- ¿Una misma persona puede pagar parte en efectivo y parte por QR?
- Si el cliente paga por QR más de lo que debe, ¿se le devuelve la diferencia en efectivo?
- ¿Se redondean los centavos? ¿A cuánto?
*Por qué:* es la única complicación que mencionó en la primera entrevista (RF-18, RF-20, RN-07). Hoy el sistema solo divide por monto.
*Propuesta:* dividir por ítems y por monto; tolerancia de redondeo de 0.50 Bs.

**P-03 · Control de los juegos con código QR o de barras: ¿sigue siendo lo más necesario?**
- ¿Pegarían una etiqueta con código en cada caja? ¿Cuántos juegos tienen?
- ¿Tienen lector de códigos, o se usaría la cámara del celular?
- ¿Qué tiene que pasar al leer el código: solo agregar el juego a la mesa, o también registrar que salió y volvió del estante?
*Por qué:* en la entrevista de 2025 fue lo que vio **más necesario**, y no existe (RF-39).

**P-04 · Precio de los juegos: ¿siguen cobrando por préstamo y no por tiempo?**
- ¿El precio depende del tamaño del juego (chico, mediano, grande)?
- ¿Se cobra cada préstamo aunque devuelvan un juego y saquen otro?
*Por qué:* confirma RN-04; si el precio va por tamaño, cambia el modelo de datos.

**P-23 · ¿Hay juegos con un precio distinto al de su etiqueta?** *(agregada el 25/11/2026, al escribir el ADR-007)*
- ¿Algún juego se cobra distinto de lo que indica el color de su etiqueta (por ejemplo, un juego grande que se presta más barato)?
*Por qué:* el ADR-007 propone que el precio salga **solo** del tamaño, sin precio propio por juego, para que la etiqueta siempre diga cuánto cobrar. Si hay excepciones, hay que permitir un precio propio por juego (#37).
*Propuesta:* sin excepciones; si un juego tiene otro precio, se le cambia la etiqueta.

**P-05 · Reservas: tiempos**
- ¿Cuánto se espera a un cliente con reserva antes de liberar la mesa? (En 2025 dijo **30 min**; el sistema tiene 20.)
- ¿Cuánto tiempo antes de la hora reservada se deja de ocupar la mesa con otros clientes?
- ¿Cuánto dura, en promedio, un grupo en una mesa? (Sirve para saber cuánto bloquear después.)
- ¿Hace falta registrar cuántas personas vienen?
*Por qué:* RN-02 y RN-12 hoy tienen valores que puso el equipo, no el negocio.
*Propuesta:* 30 min de tolerancia; bloqueo de 2 horas antes y después (como ahora) hasta tener el dato real.

**P-06 · Descuentos a clientes**
- ¿Quién puede hacer descuentos: cualquiera, solo el cajero, solo usted?
- ¿Hay un tope (por ejemplo, hasta 10 % sin permiso; más, con autorización)?
- ¿Cuáles son los motivos habituales (cumpleaños, cliente frecuente, compensación por demora…)?
*Por qué:* hoy un mesero puede dejar una cuenta en 0 Bs sin que nadie lo apruebe (RN-06).
*Propuesta:* el mesero aplica hasta un tope; por encima, firma del cajero o del administrador, igual que la aprobación de asistencia.

## B. Caja y dinero

**P-09 · Apertura y cierre del día**
- ¿Quién abre y quién cierra? ¿Siempre la misma persona?
- ¿Se cuenta el dinero de la caja al abrir (monto inicial) y al cerrar (arqueo)?
- Si después de cerrar llega un cliente, ¿se puede reabrir el día?
- ¿Qué tiene que mostrar el reporte de cierre? (Mostrarle la lista de RF-22.)
*Por qué:* el cierre no existe en el servidor (RF-22, RF-23).

**P-11 · Facturación**
- ¿Siguen sin emitir facturas? ¿Esperan tener que hacerlo pronto?
*Por qué:* define si RF-24 queda como futuro.
*Propuesta:* fuera de la primera entrega.

**P-12 · Productos y ganancias**
- ¿Quiere registrar el **costo** de cada producto para ver la ganancia, o le basta con los ingresos?
- ¿Las zonas de preparación son solo **Cocina** y **Cafetería**? ¿Algún producto no pasa por ninguna (por ejemplo, una gaseosa que se saca del refrigerador)?
- ¿Quién marca un producto como agotado: el cajero, la cocina, usted?
*Por qué:* RF-32, RF-14 (hoy hay zonas mezcladas que esconden productos) y RF-33.

**P-21 · ¿Quién puede borrar una orden?** *(agregada el 25/11/2026, al armar la matriz de permisos)*
- Si una orden se abrió por error o tiene ítems ya enviados a cocina, ¿quién la puede borrar o cancelar? ¿Hace falta un motivo?
*Por qué:* hoy cualquier rol borra una orden, incluso con ítems enviados a cocina, y no queda registro (#44). La [matriz de permisos](../03_diseno/permisos.md) lo deja abierto a los 3 roles hasta tener la respuesta.
*Propuesta:* cualquier rol, con motivo obligatorio y registro de quién lo hizo.

## C. Personal

**P-07 · Atrasos**
- Confirmar la tabla: hasta 5 min nada; 10 min, −10 % del día; 20 min, −20 % del día; 1 hora o más, −1 % del mes por hora.
- ¿Qué pasa con 7 minutos? ¿Y con 35? (¿se redondea al escalón de abajo o al de arriba?)
- ¿Quién confirma la llegada de un empleado: el cajero, el administrador, también un mozo?
- ¿Los horarios cambian por día? ¿Importa la hora de salida?
*Por qué:* RN-01 y RN-10 están incompletas y hoy el descuento lo decide el navegador (A6).

**P-08 · Sueldos**
- ¿Quiere que el sistema calcule el sueldo neto (sueldo − descuentos), o solo que reporte los atrasos y usted calcula aparte?
*Por qué:* RF-45 implica guardar sueldos, que es un dato sensible y necesita más protección.
*Propuesta:* solo reportar atrasos y porcentaje acumulado por mes; el sueldo, fuera del sistema.

**P-10 · Roles y áreas**
- ¿Qué roles hay hoy? (En 2025: administrador, cajero e instructor, chef, encargado de cafetería, mesera de fin de semana.)
- ¿La cocina y la cafetería van a usar el sistema (una pantalla con los pedidos) o solo reciben la comanda impresa?
- Si reciben impresión: ¿cuántas impresoras hay y de qué tipo (térmica de tickets, marca y modelo)?
- ¿Es necesario que el mesero vea al instante cuándo un pedido está listo?
*Por qué:* define si se agregan roles de cocina y cafetería (RF-16, RNF-04) y cómo se resuelve la impresión desde el servidor local.

## D. Local, equipos y datos

**P-13 · Equipos**
- ¿Qué PC va a usar el sistema? (Sistema operativo, si queda encendida todo el día, si se usa para otras cosas, como las transmisiones en vivo.)
- ¿Cómo es el WiFi del local? ¿Llega bien a los dos pisos?
- ¿Los meseros usarían su propio celular o uno del local? ¿Android?
*Por qué:* RNF-01 a RNF-03 y la app Android para meseros.

**P-14 · Respaldos**
- ¿Dónde quiere que se guarden las copias de seguridad (disco externo, USB, Google Drive)?
- ¿Quién las revisa?
*Por qué:* RF-54. Si la PC se daña, sin respaldo se pierde todo.
*Propuesta:* respaldo automático diario en la PC y una copia semanal en Drive.

**P-15 · Los Excel actuales**
- ¿Puede compartir los Excel de productos, juegos y precios para cargarlos al sistema?
- ¿Quiere conservar los datos históricos de ventas de los Excel? *(Para el sistema no son necesarios.)*
*Por qué:* la importación por Excel ya existe (RF-36) y evita cargar todo a mano.

**P-16 · Mesas**
- ¿Cuántos pisos y mesas hay hoy?
- ¿Le sirve un plano con la ubicación de cada mesa, o basta una lista por piso?
- ¿Hace falta un estado "por limpiar"?
*Por qué:* RF-04 y RF-05.

## E. Clientes

**P-17 · Clientes frecuentes**
- ¿Quiere registrar clientes solo para reservas, o también para saber quién viene seguido?
- ¿Qué son las "dragomonedas"? ¿Es un programa de puntos que le interesa tener en el sistema?
*Por qué:* el análisis de frecuencia de visitas (DW) necesita identificar al cliente; hoy no se hace.

**P-18 · Catálogo de juegos por QR**
- ¿El cliente debe ver también los juegos que no están disponibles (por ejemplo, prestados o en reparación)?
- ¿El QR de la mesa debería mostrar también el menú de comida, o el menú sigue en Canva/PDF?
*Por qué:* RF-40 y RN-13.

## F. Control y entrega

**P-19 · Bitácora de cambios**
- ¿Le interesa ver quién cambió un precio, quién borró un producto de una orden o quién aplicó un descuento?
*Por qué:* RF-53. Ayuda a detectar errores o abusos, pero agrega trabajo.

**P-20 · Prueba piloto y entrega**
- ¿Cuándo se podría probar el sistema en el local durante 1 o 2 semanas, en paralelo con el Excel?
- ¿Quién del personal lo probaría primero?
- Al terminar, ¿estaría dispuesto a firmar un acta de entrega y una constancia del trabajo realizado?
*Por qué:* Etapa 7.

**P-22 · ¿Quiere cambiar él mismo los permisos del cajero y del mesero?** *(agregada el 25/11/2026)*
- Si algún día quiere que el mesero pueda (o no pueda) hacer algo, ¿prefiere cambiarlo él desde el panel de administración, o pedírselo al desarrollador?
- Confirmar las dos acciones que hoy solo hace el cajero: **aprobar o anular asistencias** y **anular un pago**. ¿El mesero también tiene que poder?
*Por qué:* RF-58 y RN-16. El administrador siempre tiene todos los permisos (RN-17). La pantalla para editar permisos es la issue #87; el sistema ya va a trabajar con permisos por acción (ADR-008), así que el cambio es posible.
*Propuesta:* sí, con los tres roles fijos y solo para cajero y mesero.

---

## Respuestas

**M** = respondió Marcelo (25/11/2026). **Prueba** = valor provisional para desarrollar, que se confirma con el dueño.

| Pregunta | Respuesta | Quién | Cambios en requisitos |
|----------|-----------|-------|-----------------------|
| P-01 Alcance | Pendiente | — | — |
| P-02 Cuenta individual | Pasan las dos cosas: cada uno paga lo suyo o se divide por monto. Una persona puede pagar parte en efectivo y parte por QR. Si alguien paga de más por QR (no debería pasar) se le devuelve la diferencia, sin registrarlo en el sistema. Se acepta la propuesta: dividir por ítems y por monto, tolerancia de 0.50 Bs | M | RF-18, RF-20, RN-07, RN-14 |
| P-03 Juegos con código | Hoy cada juego tiene una etiqueta de color que representa su precio. El lector de códigos queda en **prioridad baja**. Se usaría un lector; al leer un código, el juego se agrega a la mesa y se registra que salió y volvió al estante. La lectura se hace al final, al momento del pago (como hoy se anota en el Excel cuando devuelven el juego) | M | RF-39 (prioridad F) |
| P-04 Precio de juegos | El precio depende del tamaño. Cada préstamo se cobra: si sacan dos juegos, se registran los dos en la mesa. El admin debe poder definir tamaños y asignar un precio a cada uno | M | RN-04, RF-37, RF-38, **RF-57 nuevo** |
| P-05 Reservas | Tolerancia: **30 min**. Bloqueo antes de la reserva: sin dato, **1 h** como prueba. Un grupo se queda **1 a 2 horas**. Registrar cuántas personas vienen: preferiblemente, sirve para reportes | M · bloqueo: prueba | RN-02, RN-12, RF-25 |
| P-06 Descuentos | Los aplican el **cajero y el mesero**, **sin tope** y **sin doble comprobación**. Motivos habituales: cumpleaños y comida entregada por error. El admin debe tener una sección con los descuentos hechos y su motivo | M | RN-06, RF-11, RF-49 (prioridad I) |
| P-07 Atrasos | Tabla real (audio): desde 10 min, −10 % del pago diario; desde 20 min, −20 %; más de 25 min, no se paga el día. Se aplica desde que se cruza el umbral. Quién confirma la llegada: pendiente, **el cajero** como prueba. Cada empleado tiene su horario; la hora de salida sirve para reportes o para salarios | M · quién confirma: prueba | RN-01, RN-10, RF-42, RF-43, RF-44 |
| P-08 Sueldos | Se acepta la propuesta (solo reportar atrasos y porcentaje acumulado) como valor de prueba; la pregunta sigue pendiente | Prueba | RF-45, RN-11 |
| P-09 Apertura y cierre | No siempre abre y cierra la misma persona. Se debe poder **reabrir el día** por errores humanos. Monto inicial y arqueo: pendiente. Contenido del reporte de cierre: pendiente | M · resto pendiente | RF-22, **RF-56 nuevo**, RF-23 |
| P-10 Roles y áreas | Se mantienen los roles del sistema (ADMIN, CAJERO, MESERO). Cocina y cafetería **solo reciben la comanda impresa**. Impresoras y si el mesero debe ver al instante cuándo está listo un pedido: pendiente | M · resto pendiente | RF-15, RF-16 descartado, RNF-04 |
| P-11 Facturación | Totalmente fuera de la primera entrega | M | RF-24 |
| P-12 Productos | El costo se registra de forma **opcional**. Zonas: **Cocina y Cafetería** como prueba. Quién marca agotado: pendiente | M · zonas: prueba | RF-32, RF-14, RF-33 |
| P-13 Equipos | Pendiente | — | — |
| P-14 Respaldos | Pendiente | — | — |
| P-15 Excel actuales | Pendiente | — | — |
| P-16 Mesas | Las mesas como tarjetas ya fueron aceptadas en un semestre anterior: **no hace falta plano**. El estado "sucia" no se usa. Cantidad de pisos y mesas: pendiente | M | RF-04 y RF-05 descartados |
| P-17 Clientes frecuentes | Pendiente | — | — |
| P-18 Catálogo por QR | Pendiente | — | — |
| P-19 Bitácora | Pendiente | — | — |
| P-20 Piloto y entrega | Pendiente | — | — |
| P-21 Quién borra órdenes | Pendiente. Mientras tanto, los 3 roles (como hoy). Relacionado: Marcelo decidió que **el mesero también cobra** y que mesero y cajero tienen casi los mismos permisos | M (cobro) · resto pendiente | RF-17, RF-22, **RN-16 nueva**, RF-52 |
| P-22 Editar permisos desde el panel | Pendiente | — | RF-58, RN-16, RN-17 |
| P-23 Juegos con precio distinto al de su etiqueta | Pendiente. Mientras tanto, sin excepciones (ADR-007) | Prueba | RF-57, RN-04 |

**Requisito nuevo sin pregunta:** mover una orden abierta a otra mesa (RF-55), para cuando un grupo chico ocupa una mesa grande y llega un grupo más grande. La mesa de destino tiene que estar libre y sin reserva próxima (RN-15).

## Pendientes para el 10/12

Lista corta para la presentación del MVP al dueño, en orden de importancia:

1. **P-01** · Qué es imprescindible para empezar a usar el sistema.
2. **P-09** · ¿Se cuenta el dinero al abrir y al cerrar (arqueo)? ¿Qué debe mostrar el reporte de cierre? ¿Quién puede reabrir un día cerrado?
3. **P-21** · ¿Quién puede borrar una orden con ítems ya enviados a cocina? ¿Con motivo? (Mientras tanto: cualquier rol.) Confirmar también que el mesero cobra y tiene casi los mismos permisos que el cajero (RN-16).
4. **P-22** · ¿Quiere cambiar él mismo los permisos del cajero y del mesero desde el panel? ¿El mesero también puede aprobar asistencias y anular pagos?
5. **P-23** · ¿Algún juego tiene un precio distinto al de su etiqueta de color? (Mientras tanto: no; el precio sale solo del tamaño.)
6. **P-05** · ¿Cuánto tiempo antes de una reserva se deja de dar la mesa? (Prueba: 1 h.)
7. **P-07** · ¿Quién confirma la llegada de un empleado? (Prueba: el cajero.) ¿Una llegada marcada como FALTA o PERMISO lleva descuento por atraso? (Mientras tanto: no; el descuento solo se calcula para PRESENTE, #29.)
8. **P-08** · ¿El sistema solo reporta atrasos, o también calcula sueldos? (Prueba: solo atrasos.)
9. **P-10** · Impresoras (cuántas, tipo, marca y modelo). ¿El mesero tiene que ver al instante cuándo está listo un pedido?
10. **P-12** · ¿Las zonas son solo Cocina y Cafetería? ¿Quién marca un producto como agotado?
11. **P-13 a P-15** · Equipos del local, respaldos y los Excel actuales.
12. **P-16** · ¿Cuántos pisos y mesas hay hoy?
13. **P-17 a P-20** · Clientes frecuentes, catálogo por QR, bitácora, piloto y entrega.
14. **Confirmar con el dueño** las respuestas de Marcelo, sobre todo la tabla de atrasos (RN-01) y los descuentos sin tope (RN-06).
