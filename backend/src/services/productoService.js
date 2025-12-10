// AGREGAMOS 'ProductoCategoria' A LAS IMPORTACIONES
const { Producto, Categoria, ProductoCategoria } = require('../models');

// Crear producto y asignar categorías
async function crearProducto(datos, idsCategorias = []) {
    // 1. Crear el producto base
    const nuevoProducto = await Producto.create(datos);

    // 2. Si vienen categorías, creamos la relación MANUALMENTE
    if (idsCategorias && idsCategorias.length > 0) {
        // En lugar de usar el método mágico setCategorias que falla,
        // preparamos los datos para la tabla intermedia.
        const relaciones = idsCategorias.map(categoriaId => ({
            producto_id: nuevoProducto.id,
            categoria_id: categoriaId
        }));

        // Insertamos directamente en la tabla puente
        await ProductoCategoria.bulkCreate(relaciones);
    }

    // 3. Devolvemos el producto con sus categorías
    return await Producto.findByPk(nuevoProducto.id, {
        include: [{
            model: Categoria,
            attributes: ['id', 'nombre'],
            through: { attributes: [] } 
        }]
    });
}

// Listar productos (Se mantiene igual)
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

// Obtener por ID (Se mantiene igual)
async function obtenerProductoPorId(id) {
    return await Producto.findByPk(id, {
        include: [{
            model: Categoria,
            attributes: ['id', 'nombre'],
            through: { attributes: [] }
        }]
    });
}

// Actualizar producto (MODIFICADO)
async function actualizarProducto(id, datos, idsCategorias) {
    const producto = await Producto.findByPk(id);
    if (!producto) return null;

    // 1. Actualizar campos básicos
    await producto.update(datos);

    // 2. Actualizar categorías si se enviaron
    if (idsCategorias) {
        // A. Borramos las relaciones viejas de este producto
        await ProductoCategoria.destroy({
            where: { producto_id: id }
        });

        // B. Insertamos las nuevas relaciones (si el array no está vacío)
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

// Eliminar (Se mantiene igual)
async function eliminarProducto(id) {
    const producto = await Producto.findByPk(id);
    if (!producto) return null;

    await producto.destroy();
    return true;
}

// Toggle (Se mantiene igual)
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