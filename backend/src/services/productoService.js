
const { Producto, Categoria, ProductoCategoria } = require('../models');

async function crearProducto(datos, idsCategorias = []) {
    const nuevoProducto = await Producto.create(datos);

    if (idsCategorias && idsCategorias.length > 0) {
        const relaciones = idsCategorias.map(categoriaId => ({
            producto_id: nuevoProducto.id,
            categoria_id: categoriaId
        }));

        await ProductoCategoria.bulkCreate(relaciones);
    }

    return await Producto.findByPk(nuevoProducto.id, {
        include: [{
            model: Categoria,
            attributes: ['id', 'nombre'],
            through: { attributes: [] } 
        }]
    });
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
        include: [{
            model: Categoria,
            attributes: ['id', 'nombre'],
            through: { attributes: [] }
        }]
    });
}

async function actualizarProducto(id, datos, idsCategorias) {
    const producto = await Producto.findByPk(id);
    if (!producto) return null;

    await producto.update(datos);

    if (idsCategorias) {
        await ProductoCategoria.destroy({
            where: { producto_id: id }
        });

        if (idsCategorias.length > 0) {
            const relaciones = idsCategorias.map(categoriaId => ({
                producto_id: id,
                categoria_id: categoriaId
            }));
            await ProductoCategoria.bulkCreate(relaciones);
        }
    }

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