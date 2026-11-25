const { ContenedorProducto, Orden, Producto, sequelize } = require('../models');
const { actualizarTotalOrden } = require('../utils/orderUtils');

async function agregarItem(datos) {
    return await sequelize.transaction(async (t) => {
        const orden = await Orden.findByPk(datos.orden_id, { transaction: t });
        if (!orden) throw new Error('La orden no existe.');
        if (orden.finalizado) throw new Error('No se pueden agregar productos a una orden finalizada.');

        const producto = await Producto.findByPk(datos.producto_id, { transaction: t });
        if (!producto) throw new Error('El producto no existe.');

        // Se suma a la línea que ya tiene el producto con el mismo precio. Si el precio cambió
        // desde que se pidió, las unidades nuevas van en otra línea con el precio nuevo (#22).
        const itemExistente = await ContenedorProducto.findOne({
            where: {
                orden_id: datos.orden_id,
                producto_id: datos.producto_id,
                precio_unitario: producto.precio
            },
            transaction: t
        });

        let itemFinal;

        if (itemExistente) {
            const nuevaCantidad = itemExistente.cantidad + parseInt(datos.cantidad);
            const nuevoRecibido = itemExistente.cantidad_recibido + parseInt(datos.cantidad);

            await itemExistente.update(
                {
                    cantidad: nuevaCantidad,
                    cantidad_recibido: nuevoRecibido
                },
                { transaction: t }
            );

            itemFinal = itemExistente;
        } else {
            itemFinal = await ContenedorProducto.create(
                {
                    orden_id: datos.orden_id,
                    producto_id: datos.producto_id,
                    precio_unitario: producto.precio,
                    cantidad: datos.cantidad,
                    comentario: datos.comentario,
                    cantidad_recibido: datos.cantidad,
                    cantidad_preparando: 0,
                    cantidad_terminado: 0,
                    cantidad_enviado: 0
                },
                { transaction: t }
            );
        }

        await actualizarTotalOrden(datos.orden_id, t);

        return await ContenedorProducto.findByPk(itemFinal.id, {
            include: [{ model: Producto, attributes: ['id', 'nombre', 'precio'], paranoid: false }],
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
                attributes: ['id', 'nombre', 'precio', 'zona', 'imagen'],
                // Un producto borrado del catálogo sigue apareciendo en las órdenes que lo tienen
                paranoid: false
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
        if (orden.finalizado) throw new Error('Orden cerrada.');

        // El precio cobrado no se cambia desde aquí: se fija al agregar el ítem (#22)
        const cambios = { ...datos };
        delete cambios.precio_unitario;
        await item.update(cambios, { transaction: t });

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
        if (orden.finalizado) throw new Error('Orden cerrada.');

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
