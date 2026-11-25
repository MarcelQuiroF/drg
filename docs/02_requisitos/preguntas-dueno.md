# Preguntas para el dueño

> **Para la reunión de validación del alcance (Etapa 1).** Preparadas el 24/11/2026.
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

---

## Respuestas

> Completar durante o después de la reunión.

| Pregunta | Respuesta | Fecha | Cambios en requisitos |
|----------|-----------|-------|-----------------------|
| P-01 | | | |
| P-02 | | | |
| P-03 | | | |
| P-04 | | | |
| P-05 | | | |
| P-06 | | | |
| P-07 | | | |
| P-08 | | | |
| P-09 | | | |
| P-10 | | | |
| P-11 | | | |
| P-12 | | | |
| P-13 | | | |
| P-14 | | | |
| P-15 | | | |
| P-16 | | | |
| P-17 | | | |
| P-18 | | | |
| P-19 | | | |
| P-20 | | | |
