const { ContenedorJuego, ContenedorProducto, Orden, Juego, Producto, sequelize } = require('../models');

async function actualizarTotalOrden(ordenId, transaction) {
    const itemsProducto = await ContenedorProducto.findAll({
        where: { orden_id: ordenId },
        include: [{ model: Producto, attributes: ['precio'] }],
        transaction
    });

    let totalProductos = 0;
    itemsProducto.forEach(item => {
        if (item.Producto) {
            totalProductos += parseFloat(item.Producto.precio) * item.cantidad;
        }
    });

    const itemsJuego = await ContenedorJuego.findAll({
        where: { orden_id: ordenId },
        include: [{ model: Juego, attributes: ['precio'] }],
        transaction
    });

    let totalJuegos = 0;
    itemsJuego.forEach(item => {
        if (item.Juego) {
            totalJuegos += parseFloat(item.Juego.precio) * item.cantidad;
        }
    });

    await Orden.update(
        { total: totalProductos + totalJuegos },
        { where: { id: ordenId }, transaction }
    );
}

async function agregarJuego(datos) {
    return await sequelize.transaction(async (t) => {
        const orden = await Orden.findByPk(datos.orden_id, { transaction: t });
        if (!orden) throw new Error("La orden no existe.");
        if (orden.finalizado) throw new Error("Orden finalizada.");

        const juego = await Juego.findByPk(datos.juego_id, { transaction: t });
        if (!juego) throw new Error("El juego no existe.");

        const nuevoJuego = await ContenedorJuego.create({
            orden_id: datos.orden_id,
            juego_id: datos.juego_id,
            cantidad: datos.cantidad,
            comentario: datos.comentario,
            hora_inicio: new Date(),
        }, { transaction: t });

        await actualizarTotalOrden(datos.orden_id, t);

        return await ContenedorJuego.findByPk(nuevoJuego.id, {
            include: [{ model: Juego, attributes: ['nombre', 'precio'] }],
            transaction: t
        });
    });
}


async function listarPorOrden(ordenId) {
    return await ContenedorJuego.findAll({
        where: { orden_id: ordenId },
        include: [
            { model: Juego, attributes: ['id', 'nombre', 'precio', 'imagen', 'tiempo_partida'] }
        ],
        order: [['hora_inicio', 'ASC']]
    });
}

async function terminarJuego(id) {
    const item = await ContenedorJuego.findByPk(id);
    if (!item) return null;

    return await item.update({ hora_fin: new Date() });
}

async function eliminarJuego(id) {
    return await sequelize.transaction(async (t) => {
        const item = await ContenedorJuego.findByPk(id, { transaction: t });
        if (!item) return null;

        const ordenId = item.orden_id;
        const orden = await Orden.findByPk(ordenId, { transaction: t });
        if (orden.finalizado) throw new Error("Orden cerrada.");

        await item.destroy({ transaction: t });
        await actualizarTotalOrden(ordenId, t);

        return true;
    });
}

module.exports = {
    agregarJuego,
    listarPorOrden,
    terminarJuego,
    eliminarJuego
};