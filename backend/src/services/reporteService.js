const { ContenedorTransaccion, Orden, sequelize } = require('../models');
const { Op } = require('sequelize');

async function generarCierreCaja(fecha) {
    const inicioDia = fecha ? new Date(fecha) : new Date();
    inicioDia.setHours(0, 0, 0, 0);
    
    const finDia = new Date(inicioDia);
    finDia.setHours(23, 59, 59, 999);

    const pagos = await ContenedorTransaccion.findAll({
        where: {
            fecha: { [Op.between]: [inicioDia, finDia] },
            activo: true
        }
    });


    let totalIngresos = 0;
    const desgloseMetodos = {};

    pagos.forEach(pago => {
        const monto = parseFloat(pago.cantidad);
        totalIngresos += monto;

        if (!desgloseMetodos[pago.tipo]) {
            desgloseMetodos[pago.tipo] = 0;
        }
        desgloseMetodos[pago.tipo] += monto;
    });

    const ordenesFinalizadas = await Orden.count({
        where: {
            updatedAt: { [Op.between]: [inicioDia, finDia] }, 
            finalizado: true
        }
    });


    return {
        fecha: inicioDia.toISOString().split('T')[0],
        resumen_financiero: {
            total_global: totalIngresos,
            desglose_por_metodo: desgloseMetodos
        },
        operatividad: {
            total_transacciones: pagos.length,
            ordenes_cerradas: ordenesFinalizadas
        },
        generado_a: new Date()
    };
}

module.exports = {
    generarCierreCaja
};