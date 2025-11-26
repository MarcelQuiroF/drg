const { Orden, Mesa, Empleado, sequelize } = require('../models');

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

module.exports = {
    crearOrden,
    listarOrdenes,
    obtenerOrdenPorId,
    finalizarOrden,
    eliminarOrden
};
