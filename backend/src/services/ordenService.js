const { 
    Orden, 
    Mesa, 
    Empleado, 
    Descuento, 
    OrdenDescuento, 
    ContenedorProducto, 
    ContenedorJuego, 
    Producto, 
    Juego, 
    sequelize 
} = require('../models');

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

async function finalizarOrden(id) {
    return await sequelize.transaction(async (t) => {
        const orden = await Orden.findByPk(id, { transaction: t });
        if (!orden) throw new Error("Orden no encontrada.");
        
        if (orden.finalizado) throw new Error("La orden ya estaba finalizada.");

        await orden.update({ finalizado: true }, { transaction: t });

        await Mesa.update(
            { estado: 0 }, 
            { where: { id: orden.mesa_id }, transaction: t }
        );

        return orden;
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

        let totalActual = parseFloat(orden.total);
        let montoDescontar = 0;

        if (datos.monto && parseFloat(datos.monto) > 0) {
            montoDescontar = parseFloat(datos.monto);
        } else if (datos.porcentaje && parseFloat(datos.porcentaje) > 0) {
            montoDescontar = (totalActual * parseFloat(datos.porcentaje)) / 100;
        }

        let nuevoTotal = totalActual - montoDescontar;
        if (nuevoTotal < 0) nuevoTotal = 0;

        await orden.update({ total: nuevoTotal }, { transaction: t });

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
        const orden = await Orden.findByPk(ordenId, { transaction: t });
        if (!orden) throw new Error("Orden no encontrada.");
        if (orden.finalizado) throw new Error("Orden cerrada.");

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
        let totalBase = prods.reduce((sum, item) => sum + (parseFloat(item.Producto.precio) * item.cantidad), 0);

        const juegos = await ContenedorJuego.findAll({
            where: { orden_id: ordenId },
            include: [Juego],
            transaction: t
        });
        totalBase += juegos.reduce((sum, item) => sum + (parseFloat(item.Juego.precio) * item.cantidad), 0);

        const descuentosRestantes = await orden.getDescuentos({ transaction: t });
        let totalDescuentos = 0;

        for (const d of descuentosRestantes) {
            if (d.id == descuentoId) continue; 

            if (d.monto > 0) {
                totalDescuentos += parseFloat(d.monto);
            } else if (d.porcentaje > 0) {
                totalDescuentos += (totalBase * parseFloat(d.porcentaje)) / 100;
            }
        }

        let nuevoTotal = totalBase - totalDescuentos;
        if (nuevoTotal < 0) nuevoTotal = 0;

        await orden.update({ total: nuevoTotal }, { transaction: t });

        return true;
    });
}

module.exports = {
    crearOrden,
    listarOrdenes,
    obtenerOrdenPorId,
    finalizarOrden,
    eliminarOrden,
    aplicarDescuento,
    obtenerDescuentosPorOrden,
    removerDescuento
};