const { ContenedorProducto, ContenedorJuego, Orden, Producto, Juego, sequelize } = require('../models');

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

async function agregarItem(datos) {
    return await sequelize.transaction(async (t) => {

        const orden = await Orden.findByPk(datos.orden_id, { transaction: t });
        if (!orden) throw new Error("La orden no existe.");
        if (orden.finalizado) throw new Error("No se pueden agregar productos a una orden finalizada.");

        const producto = await Producto.findByPk(datos.producto_id, { transaction: t });
        if (!producto) throw new Error("El producto no existe.");

        const nuevoItem = await ContenedorProducto.create({
            orden_id: datos.orden_id,
            producto_id: datos.producto_id,
            cantidad: datos.cantidad,
            comentario: datos.comentario,
            cantidad_recibido: datos.cantidad,
            cantidad_preparando: 0,
            cantidad_terminado: 0,
            cantidad_enviado: 0
        }, { transaction: t });

        await actualizarTotalOrden(datos.orden_id, t);

        return await ContenedorProducto.findByPk(nuevoItem.id, {
            include: [{ model: Producto, attributes: ['id', 'nombre', 'precio'] }],
            transaction: t
        });
    });
}

async function listarPorOrden(ordenId) {
    return await ContenedorProducto.findAll({
        where: { orden_id: ordenId },
        include: [
            { 
                model: Producto, 
                attributes: ['id', 'nombre', 'precio', 'zona', 'imagen'] 
            }
        ],
        order: [['createdAt', 'ASC']]
    });
}

async function actualizarItem(id, datos) {
    return await sequelize.transaction(async (t) => {
        const item = await ContenedorProducto.findByPk(id, { transaction: t });
        if (!item) return null;

        const orden = await Orden.findByPk(item.orden_id, { transaction: t });
        if (orden.finalizado) throw new Error("Orden cerrada.");

        await item.update(datos, { transaction: t });
        
        await actualizarTotalOrden(item.orden_id, t);

        return item;
    });
}

async function eliminarItem(id) {
    return await sequelize.transaction(async (t) => {
        const item = await ContenedorProducto.findByPk(id, { transaction: t });
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
    agregarItem,
    listarPorOrden,
    actualizarItem,
    eliminarItem
};