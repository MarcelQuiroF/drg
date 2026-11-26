const { ContenedorTransaccion, Mesa, sequelize } = require('../models');
const { bloquearOrden } = require('../utils/orderUtils');
// El día tiene que estar abierto (#34): candado de la jornada, siempre antes que los demás
const { bloquearDiaAbierto } = require('../utils/jornada');

// Los pagos parciales también bloquean la orden (#124): dos pagos a la vez veían la misma suma
// pagada, y un ítem agregado mientras se cobraba quedaba fuera del total.
async function registrarPago(datos) {
    return await sequelize.transaction(async (t) => {
        await bloquearDiaAbierto(t);
        const orden = await bloquearOrden(datos.orden_id, t);

        if (datos.cantidad <= 0) throw new Error('El monto del pago debe ser mayor a 0.');

        const nuevoPago = await ContenedorTransaccion.create(
            {
                orden_id: datos.orden_id,
                cliente_id: datos.cliente_id || null,
                cantidad: datos.cantidad,
                tipo: datos.tipo,
                activo: true,
                fecha: new Date()
            },
            { transaction: t }
        );

        const pagos = await ContenedorTransaccion.findAll({
            where: { orden_id: datos.orden_id, activo: true },
            transaction: t
        });

        const totalPagado = pagos.reduce((sum, p) => sum + parseFloat(p.cantidad), 0);
        const totalOrden = parseFloat(orden.total);

        let estadoOrden = 'PENDIENTE';
        let restante = totalOrden - totalPagado;

        if (totalPagado >= totalOrden - 0.5) {
            await orden.update({ finalizado: true }, { transaction: t });

            await Mesa.update({ estado: 0 }, { where: { id: orden.mesa_id }, transaction: t });

            estadoOrden = 'COMPLETADO';
            restante = 0;
        }

        return {
            transaccion: nuevoPago,
            info_pago: {
                total_orden: totalOrden,
                total_pagado: totalPagado,
                restante: restante > 0 ? restante : 0,
                estado: estadoOrden
            }
        };
    });
}

async function listarPorOrden(ordenId) {
    return await ContenedorTransaccion.findAll({
        where: { orden_id: ordenId },
        order: [['fecha', 'ASC']]
    });
}

async function anularPago(id) {
    return await sequelize.transaction(async (t) => {
        const encontrado = await ContenedorTransaccion.findByPk(id, { transaction: t });
        if (!encontrado) return null;

        await bloquearOrden(encontrado.orden_id, t);
        const pago = await ContenedorTransaccion.findByPk(id, { transaction: t });
        if (!pago) return null;

        await pago.destroy({ transaction: t });
        return true;
    });
}

module.exports = {
    registrarPago,
    listarPorOrden,
    anularPago
};
