'use strict';

// Fuente única de los números de dinero (#31): las órdenes COBRADAS y sus pagos. La usan el
// dashboard (controllers/reportesController.js) y el resumen del cierre del día (#34), para que
// los dos cuenten siempre lo mismo.
const { ContenedorTransaccion, ContenedorProducto, ContenedorJuego, OrdenDescuento, sequelize } = require('../models');
const { Op, QueryTypes } = require('sequelize');

const redondear = (n) => Math.round(n * 100) / 100;

// Órdenes cobradas cuyo último pago cae en el rango [fechaInicio, fechaFin], con esa fecha.
// Sin rango, todas. Una orden cuenta el momento de su cobro (su último pago), no el de su apertura.
async function ordenesCobradas(fechaInicio, fechaFin, { transaction } = {}) {
    const filtro = fechaInicio ? 'HAVING MAX(t.fecha) BETWEEN :fechaInicio AND :fechaFin' : '';
    return sequelize.query(
        `SELECT t.orden_id, MAX(t.fecha) AS fecha_cobro
         FROM contenedor_transaccion t
         JOIN orden o ON o.id = t.orden_id AND o.finalizado = true AND o."deletedAt" IS NULL
         WHERE t."deletedAt" IS NULL
         GROUP BY t.orden_id
         ${filtro}`,
        { type: QueryTypes.SELECT, replacements: { fechaInicio, fechaFin }, transaction }
    );
}

// Resumen del cierre del día (#34; contenido de prueba de la issue hasta que el dueño responda P-09):
// total cobrado, por método de pago, número de órdenes y descuentos de las órdenes cobradas en el
// rango. Los descuentos en Bs son lo que valían los ítems menos lo cobrado (así un descuento mayor
// al subtotal cuenta solo lo que de verdad se descontó).
async function resumenDeCobros(fechaInicio, fechaFin, { transaction } = {}) {
    const cobradas = await ordenesCobradas(fechaInicio, fechaFin, { transaction });
    const ids = cobradas.map((c) => c.orden_id);
    const deLasCobradas = { where: { orden_id: { [Op.in]: ids } }, transaction };

    const [pagos, productos, juegos, descuentos] = await Promise.all([
        ContenedorTransaccion.findAll({ attributes: ['cantidad', 'tipo'], ...deLasCobradas }),
        ContenedorProducto.findAll({ attributes: ['cantidad', 'precio_unitario'], ...deLasCobradas }),
        ContenedorJuego.findAll({ attributes: ['cantidad', 'precio_unitario'], ...deLasCobradas }),
        OrdenDescuento.count(deLasCobradas)
    ]);

    let ingresos = 0;
    let efectivo = 0;
    let qr = 0;
    for (const p of pagos) {
        const monto = parseFloat(p.cantidad);
        ingresos += monto;
        if (String(p.tipo).toUpperCase() === 'EFECTIVO') efectivo += monto;
        else qr += monto;
    }
    const bruto = [...productos, ...juegos].reduce((s, i) => s + parseFloat(i.precio_unitario) * i.cantidad, 0);

    return {
        ordenes: ids.length,
        ingresos: redondear(ingresos),
        efectivo: redondear(efectivo),
        qr: redondear(qr),
        descuentos: { cantidad: descuentos, monto: redondear(Math.max(0, bruto - ingresos)) }
    };
}

module.exports = { ordenesCobradas, resumenDeCobros };
