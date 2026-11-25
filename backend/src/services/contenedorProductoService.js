const { ContenedorProducto, Producto, sequelize } = require('../models');
const { bloquearOrden, actualizarTotalOrden } = require('../utils/orderUtils');

// Todas las operaciones empiezan bloqueando la orden (bloquearOrden, #124): sin eso, pedidos
// simultáneos del mismo producto perdían unidades y el total quedaba por debajo de lo pedido.
async function agregarItem(datos) {
    return await sequelize.transaction(async (t) => {
        await bloquearOrden(datos.orden_id, t);

        const producto = await Producto.findByPk(datos.producto_id, { transaction: t });
        if (!producto) throw new Error('El producto no existe.');

        // Con la orden bloqueada, esta búsqueda ve la línea que haya creado un pedido anterior:
        // ya no se crean dos líneas del mismo producto por pedidos simultáneos (#124).
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

// El ítem se busca dos veces: la primera solo para saber de qué orden es; la segunda, ya con la
// orden bloqueada, para trabajar con la versión que dejó la operación anterior (o ver que la
// borraron mientras se esperaba el bloqueo).
async function buscarItemConOrdenBloqueada(id, t) {
    const item = await ContenedorProducto.findByPk(id, { transaction: t });
    if (!item) return null;
    await bloquearOrden(item.orden_id, t);
    return await ContenedorProducto.findByPk(id, { transaction: t });
}

async function actualizarItem(id, datos) {
    return await sequelize.transaction(async (t) => {
        const item = await buscarItemConOrdenBloqueada(id, t);
        if (!item) return null;

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
        const item = await buscarItemConOrdenBloqueada(id, t);
        if (!item) return null;

        const ordenId = item.orden_id;
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
