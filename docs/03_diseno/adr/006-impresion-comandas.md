# ADR-006: Impresión de comandas desde el servidor local

- **Estado:** Aceptado (25/11/2026, aprobado por Marcelo)
- **Fecha:** 2026-11-25
- **Issue:** #10

## Contexto

- Cocina y cafetería **no usan pantallas**: solo reciben la **comanda impresa** (RF-15, decisión del 25/11/2026; RF-16 descartado). Cada producto pertenece a una zona: Cocina o Cafetería (RF-14, valor de prueba).
- RF-15: el personal imprime la comanda de una orden **separada por zona**, eligiendo qué productos y cuántas unidades, con un contador de lo ya impreso.
- **Cómo se imprime hoy:** la vista `imprimir-comanda.html` (`frontend/js/modules/impresion.js`) arma dos tickets en pantalla, uno por zona, y llama a `window.print()` del navegador con una clase CSS que deja visible solo el ticket elegido. Se imprime en la impresora que el navegador tenga configurada, y la persona tiene que confirmar el diálogo de impresión cada vez. Todo lo que no es `COCINA` va al ticket de cafetería.
- Con eso:
  - Solo se puede imprimir desde una PC con la impresora instalada, no desde un celular. La app de meseros (ADR-005) va a enviar pedidos a cocina desde el celular, así que **la impresión tiene que hacerla el servidor**.
  - Si hay una impresora en cocina y otra en cafetería, hay que elegir la correcta a mano en cada impresión.
- **No se sabe todavía** cuántas impresoras hay, de qué tipo (térmicas de tickets o comunes), cómo se conectan (USB, red o WiFi) ni su marca y modelo (**P-10**).
- El servidor corre en la PC del local, posiblemente con Docker (ADR-003). Desde un contenedor es fácil llegar a una impresora **de red**; usar una impresora **USB** conectada a la PC es más complicado.

## Opciones consideradas

1. **Seguir imprimiendo desde el navegador** (`window.print()`).
   - A favor: ya existe; funciona con cualquier impresora instalada en el sistema operativo.
   - En contra: no sirve desde la app móvil; exige a alguien frente a la PC confirmando cada impresión; elegir la impresora de cada zona es manual.
2. **El servidor imprime directo en impresoras térmicas de red con ESC/POS** (el lenguaje estándar de las impresoras de tickets), enviando el ticket por TCP al puerto 9100 de cada impresora.
   - A favor: funciona desde la web y desde la app; cada zona tiene su impresora configurada y el ticket sale solo al "enviar a cocina"; no depende del sistema operativo ni de Docker; hay librerías de Node.js para ESC/POS.
   - En contra: necesita impresoras térmicas con red (Ethernet o WiFi); si hoy tienen impresoras USB, hay que cambiarlas o usar la opción 3 o la 4.
3. **El servidor imprime a través de la cola de impresión del sistema operativo** (Windows o CUPS en Linux), generando el ticket como texto o PDF.
   - A favor: sirve con impresoras USB instaladas en la PC.
   - En contra: depende del sistema operativo; desde un contenedor Docker es difícil; el formato de los tickets es menos controlable.
4. **Un pequeño "agente de impresión"** que corre en la PC (fuera de Docker), recibe los tickets del servidor y los manda a impresoras USB o de red.
   - A favor: resuelve las impresoras USB aunque el servidor corra en Docker.
   - En contra: un programa más que instalar, mantener y vigilar.

## Decisión

Se decide que **la impresión la hace el servidor**, con un **servicio de impresión** en el backend que separa *qué* se imprime de *cómo* llega a la impresora:

- **Qué se imprime** (igual para cualquier impresora): mesa, número de orden, fecha y hora, mesero, y los ítems de una zona con cantidad y comentario. Solo las unidades **todavía no impresas**, con el contador de RF-15.
- **Cómo llega:** se elige según la respuesta a **P-10**:
  - Si hay (o se compran) **impresoras térmicas de red** → **opción 2 (ESC/POS por red)**. Es la opción recomendada, porque es la más simple de mantener y funciona con Docker.
  - Si las impresoras son **USB** y no se cambian → **opción 4 (agente de impresión en la PC)**.
- **Se mantiene la impresión desde el navegador** (opción 1) como respaldo manual para reimprimir si una impresora falla.
- **Cola de impresión en la base:** cada ticket se guarda con su estado (pendiente, impreso, con error). Si la impresora está apagada o sin papel, el pedido **no se pierde**: el ticket queda pendiente, el personal ve el aviso y puede reintentarlo o reimprimirlo desde el navegador.
- **Configuración:** el administrador asigna una impresora (por ejemplo, su IP) a cada zona.

## Consecuencias

- **Positivas:**
  - Se puede enviar a cocina desde cualquier dispositivo, incluida la app.
  - Cada zona recibe su ticket sin elegir la impresora a mano.
  - Ningún pedido se pierde por una impresora apagada: queda en la cola.
  - Lo que se imprime no depende del tipo de impresora, así que cambiar de impresora no toca la lógica de las comandas.
- **Negativas o riesgos:**
  - Puede requerir comprar impresoras térmicas con red (decisión y gasto del dueño).
  - Probar sin la impresora real es limitado: hace falta un simulador o una impresora de prueba.
  - Una cola de impresión agrega una tabla, estados y una pantalla de avisos.
- **Qué hay que hacer ahora:**
  - Preguntar **P-10** el 10/12 (cuántas impresoras, tipo, conexión, marca y modelo) y sacar una foto de la etiqueta de cada una.
  - Mientras tanto, arreglar lo que no depende de la impresora: comandas de órdenes cobradas (#33), zonas unificadas (#32) y escape de HTML en los tickets (#23).
  - Con la respuesta, completar #67 (implementación) y crear las issues que hagan falta.

**Relacionado:** RF-14, RF-15 · ADR-003 · ADR-005 · #23 · #32 · #33 · #67
