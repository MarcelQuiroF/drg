const { Producto, Categoria, ProductoCategoria, sequelize } = require('../models');

// Ids de categoría sin repetir (un id repetido chocaría con la clave primaria de producto_categoria)
const idsUnicos = (ids) => [...new Set(ids.map(Number))];

async function guardarCategorias(productoId, idsCategorias, transaction) {
    const ids = idsUnicos(idsCategorias);
    const existentes = await Categoria.count({ where: { id: ids }, transaction });
    if (existentes !== ids.length) {
        const error = new Error('Alguna de las categorías no existe.');
        error.status = 400;
        throw error;
    }

    const relaciones = ids.map((categoriaId) => ({
        producto_id: productoId,
        categoria_id: categoriaId
    }));
    if (relaciones.length > 0) await ProductoCategoria.bulkCreate(relaciones, { transaction });
}

// Producto y categorías se guardan juntos: si algo falla no queda un producto a medias (#78)
async function crearProducto(datos, idsCategorias = []) {
    const nuevoProducto = await sequelize.transaction(async (t) => {
        const producto = await Producto.create(datos, { transaction: t });
        if (idsCategorias) await guardarCategorias(producto.id, idsCategorias, t);
        return producto;
    });

    return await obtenerProductoPorId(nuevoProducto.id);
}

async function listarProductos(categoriaId = null) {
    const includeOption = {
        model: Categoria,
        attributes: ['id', 'nombre'],
        through: { attributes: [] }
    };

    if (categoriaId) {
        includeOption.where = { id: categoriaId };
        includeOption.required = true;
    }

    return await Producto.findAll({
        include: [includeOption],
        order: [['nombre', 'ASC']]
    });
}

async function obtenerProductoPorId(id) {
    return await Producto.findByPk(id, {
        include: [
            {
                model: Categoria,
                attributes: ['id', 'nombre'],
                through: { attributes: [] }
            }
        ]
    });
}

// Si llegan categorías, reemplazan a las anteriores: se borran las relaciones (borrado físico,
// la tabla no es paranoid) y se crean las nuevas, todo en la misma transacción (#78).
async function actualizarProducto(id, datos, idsCategorias) {
    const actualizado = await sequelize.transaction(async (t) => {
        const producto = await Producto.findByPk(id, { transaction: t });
        if (!producto) return null;

        await producto.update(datos, { transaction: t });

        if (idsCategorias) {
            await ProductoCategoria.destroy({ where: { producto_id: id }, transaction: t });
            await guardarCategorias(id, idsCategorias, t);
        }
        return producto;
    });

    if (!actualizado) return null;
    return await obtenerProductoPorId(id);
}

async function eliminarProducto(id) {
    const producto = await Producto.findByPk(id);
    if (!producto) return null;

    await producto.destroy();
    return true;
}

async function toggleEstado(id) {
    const producto = await Producto.findByPk(id);
    if (!producto) return null;
    return await producto.update({ activado: !producto.activado });
}

module.exports = {
    crearProducto,
    listarProductos,
    obtenerProductoPorId,
    actualizarProducto,
    eliminarProducto,
    toggleEstado
};
