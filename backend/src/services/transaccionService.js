const { ContenedorTransaccion, Orden, Mesa, sequelize } = require('../models');

async function registrarPago(datos) {
    return await sequelize.transaction(async (t) => {
        const orden = await Orden.findByPk(datos.orden_id, { transaction: t });
        if (!orden) throw new Error("La orden no existe.");
        if (orden.finalizado) throw new Error("Esta orden ya fue pagada y finalizada.");
        
        if (datos.cantidad <= 0) throw new Error("El monto del pago debe ser mayor a 0.");

        const nuevoPago = await ContenedorTransaccion.create({
            orden_id: datos.orden_id,
            cliente_id: datos.cliente_id || null, 
            cantidad: datos.cantidad,
            tipo: datos.tipo, 
            activo: true,
            fecha: new Date()
        }, { transaction: t });

        const pagos = await ContenedorTransaccion.findAll({
            where: { orden_id: datos.orden_id, activo: true },
            transaction: t
        });

        const totalPagado = pagos.reduce((sum, p) => sum + parseFloat(p.cantidad), 0);
        const totalOrden = parseFloat(orden.total);

        let estadoOrden = "PENDIENTE";
        let restante = totalOrden - totalPagado;

        if (totalPagado >= totalOrden - 0.5) {
            
            await orden.update({ finalizado: true }, { transaction: t });
            
            await Mesa.update(
                { estado: 0 }, 
                { where: { id: orden.mesa_id }, transaction: t }
            );
            
            estadoOrden = "COMPLETADO";
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
    const pago = await ContenedorTransaccion.findByPk(id);
    if (!pago) return null;
    
    const orden = await Orden.findByPk(pago.orden_id);
    if (orden.finalizado) throw new Error("No se puede anular pagos de una orden ya cerrada.");

    await pago.destroy();
    return true;
}

module.exports = {
    registrarPago,
    listarPorOrden,
    anularPago
};