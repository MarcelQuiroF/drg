const { 
    Orden, 
    Mesa, 
    Empleado, 
    Descuento, 
    OrdenDescuento, 
    ContenedorProducto, 
    ContenedorJuego, 
    Producto,
    ContenedorTransaccion,  
    Juego, 
    sequelize,
    Configuracion,
    Reserva
} = require('../models');

const { actualizarTotalOrden } = require('../utils/orderUtils');
const { Op } = require('sequelize');

async function crearOrden(mesaId, usuarioId) {
    return await sequelize.transaction(async (t) => {
        const mesa = await Mesa.findByPk(mesaId, { transaction: t });
        if (!mesa) throw new Error("La mesa no existe.");
        
        if (mesa.estado === 1) throw new Error("La mesa ya está ocupada.");

        const nuevaOrden = await Orden.create({
            mesa_id: mesaId,
            total: 0,
            finalizado: false
        }, { transaction: t });

        await mesa.update({ estado: 1 }, { transaction: t });

        await registrarLlegadaAutomatica(mesaId, t);

        return nuevaOrden;
    });
}

async function crearOrden(mesaId, usuarioId) {
    return await sequelize.transaction(async (t) => {
        const mesa = await Mesa.findByPk(mesaId, { transaction: t });
        if (!mesa) throw new Error("La mesa no existe.");
        
        if (mesa.estado === 1) throw new Error("La mesa ya está ocupada y con orden abierta.");

        const nuevaOrden = await Orden.create({
            mesa_id: mesaId,
            total: 0,
            finalizado: false
        }, { transaction: t });

        await mesa.update({ estado: 1 }, { transaction: t });

        await registrarLlegadaAutomatica(mesaId, t);

        return nuevaOrden;
    });
}

async function listarOrdenes(filtros = {}) {
    const whereClause = {};

    if (filtros.finalizado !== undefined) {
        whereClause.finalizado = filtros.finalizado === 'true'; 
    } else {
        whereClause.finalizado = false;
    }

    if (filtros.mesa_id) {
        whereClause.mesa_id = filtros.mesa_id;
    }

    return await Orden.findAll({
        where: whereClause,
        include: [
            { 
                model: Mesa, 
                attributes: ['id', 'nombre', 'numero', 'piso_id'] 
            }
        ],
        order: [['createdAt', 'DESC']]
    });
}

async function obtenerOrdenPorId(id) {
    return await Orden.findByPk(id, {
        include: [{ model: Mesa }]
    });
}

/**
 * @param {Number} id 
 * @param {Array} pagos 
 */ 

async function finalizarOrden(id, pagos = []) {
    return await sequelize.transaction(async (t) => {
        const orden = await Orden.findByPk(id, { transaction: t });
        if (!orden) throw new Error("Orden no encontrada.");
        if (orden.finalizado) throw new Error("La orden ya estaba finalizada.");

        const totalOrden = parseFloat(orden.total);
        
        if (pagos.length === 0) {
            pagos = [{ tipo: 'EFECTIVO', monto: totalOrden }];
        }

        const sumaPagos = pagos.reduce((acc, pago) => acc + parseFloat(pago.monto), 0);
        
        if (Math.abs(sumaPagos - totalOrden) > 0.01) {
            throw new Error(`El total de los pagos (${sumaPagos}) no coincide con el total de la orden (${totalOrden})`);
        }

        for (const pago of pagos) {
            await ContenedorTransaccion.create({
                fecha: new Date(),
                cantidad: pago.monto,
                tipo: pago.tipo.toUpperCase(),
                orden_id: id,
                activo: true
            }, { transaction: t });
        }

        await orden.update({ finalizado: true }, { transaction: t });

        await Mesa.update(
            { estado: 0 }, 
            { where: { id: orden.mesa_id }, transaction: t }
        );

        return { orden, transacciones: pagos.length };
    });
}

async function eliminarOrden(id) {
    return await sequelize.transaction(async (t) => {
        const orden = await Orden.findByPk(id, { transaction: t });
        if (!orden) return null;

        if (!orden.finalizado) {
            await Mesa.update({ estado: 0 }, { where: { id: orden.mesa_id }, transaction: t });
        }

        await orden.destroy({ transaction: t });
        return true;
    });
}


async function aplicarDescuento(ordenId, datos) {
    return await sequelize.transaction(async (t) => {
        const orden = await Orden.findByPk(ordenId, { transaction: t });
        if (!orden) throw new Error("Orden no encontrada.");
        if (orden.finalizado) throw new Error("No se puede aplicar descuento a una orden cerrada.");

        const nuevoDescuento = await Descuento.create({
            porcentaje: datos.porcentaje || 0, 
            monto: datos.monto || 0,
            comentario: datos.comentario || ""
        }, { transaction: t });

        await OrdenDescuento.create({
            orden_id: ordenId,
            descuento_id: nuevoDescuento.id
        }, { transaction: t });

        await actualizarTotalOrden(ordenId, t);

        return nuevoDescuento;
    });
}

async function obtenerDescuentosPorOrden(ordenId) {
    const orden = await Orden.findByPk(ordenId, {
        include: [{ model: Descuento }]
    });
    return orden ? orden.Descuentos : [];
}

async function removerDescuento(ordenId, descuentoId) {
    return await sequelize.transaction(async (t) => {
        // 1. Buscar la orden
        const orden = await Orden.findByPk(ordenId, { transaction: t });
        if (!orden) throw new Error("Orden no encontrada.");
        if (orden.finalizado) throw new Error("No se puede modificar una orden cerrada.");

        await OrdenDescuento.destroy({
            where: { orden_id: ordenId, descuento_id: descuentoId },
            transaction: t
        });
        await Descuento.destroy({
            where: { id: descuentoId },
            transaction: t
        });

        const prods = await ContenedorProducto.findAll({
            where: { orden_id: ordenId },
            include: [Producto],
            transaction: t
        });
        
        let totalBase = prods.reduce((sum, item) => {
            const precio = item.Producto ? parseFloat(item.Producto.precio) : 0;
            const cantidad = item.cantidad || 0;
            return sum + (precio * cantidad);
        }, 0);

        const juegos = await ContenedorJuego.findAll({
            where: { orden_id: ordenId },
            include: [Juego],
            transaction: t
        });

        totalBase += juegos.reduce((sum, item) => {
            const precio = item.Juego ? parseFloat(item.Juego.precio) : 0;
            const cantidad = item.cantidad || 0;
            return sum + (precio * cantidad);
        }, 0);

        const ordenActualizada = await Orden.findByPk(ordenId, {
            include: [{ 
                model: Descuento,
                through: { where: { deletedAt: null } }
            }],
            transaction: t
        });

        await actualizarTotalOrden(ordenId, t);

        return true;
    });
}

async function registrarLlegadaAutomatica(mesaId, transaction) {
    const [configLlegada, configTolerancia] = await Promise.all([
        Configuracion.findOne({ where: { clave: 'ventana_llegada' } }),
        Configuracion.findOne({ where: { clave: 'minutos_tolerancia' } })
    ]);

    const ventanaAnticipacionMins = configLlegada ? configLlegada.valor : 30;
    const toleranciaRetrasoMins = configTolerancia ? configTolerancia.valor : 20;

    const ahora = new Date();

    const reserva = await Reserva.findOne({
        where: {
            mesa_id: mesaId,
            estado: 'PENDIENTE',
            hora: {
                [Op.between]: [
                    new Date(ahora.getTime() - (toleranciaRetrasoMins * 60 * 1000)),
                    new Date(ahora.getTime() + (ventanaAnticipacionMins * 60 * 1000))
                ]
            }
        },
        transaction
    });

    if (reserva) {
        await reserva.update({ estado: 'LLEGO' }, { transaction });
        console.log(`[Sistema] Reserva ${reserva.id} detectada. Estado: LLEGÓ.`);
    }
}



module.exports = {
    crearOrden,
    listarOrdenes,
    obtenerOrdenPorId,
    finalizarOrden,
    eliminarOrden,
    aplicarDescuento,
    obtenerDescuentosPorOrden,
    removerDescuento,
    registrarLlegadaAutomatica
};