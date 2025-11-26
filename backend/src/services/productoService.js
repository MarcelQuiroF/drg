const { Producto, Categoria } = require('../models');

// Crear producto y asignar categorías (si vienen)
async function crearProducto(datos, idsCategorias = []) {
    // 1. Crear el producto base
    const nuevoProducto = await Producto.create(datos);

    // 2. Si vienen categorías, creamos la relación en la tabla intermedia
    if (idsCategorias && idsCategorias.length > 0) {
        // setCategorias es un método mágico que crea Sequelize al definir la relación N:M
        await nuevoProducto.setCategorias(idsCategorias);
    }

    // 3. Devolvemos el producto con sus categorías cargadas para confirmar
    return await Producto.findByPk(nuevoProducto.id, {
        include: [{
            model: Categoria,
            attributes: ['id', 'nombre'],
            through: { attributes: [] } // Ocultar datos de la tabla puente
        }]
    });
}

// Modificamos esta función para aceptar filtros
async function listarProductos(categoriaId = null) {
    
    // Configuración base del include
    const includeOption = {
        model: Categoria,
        attributes: ['id', 'nombre'],
        through: { attributes: [] }
    };

    // Si nos pasan un ID de categoría, filtramos
    if (categoriaId) {
        includeOption.where = { id: categoriaId };
        includeOption.required = true; // IMPORTANTE: Solo devuelve productos que coincidan con la categoría
    }

    return await Producto.findAll({
        include: [includeOption],
        // Opcional: Ordenar por nombre para que se vea ordenado
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

// Actualizar producto y sus relaciones
async function actualizarProducto(id, datos, idsCategorias) {
    const producto = await Producto.findByPk(id);
    if (!producto) return null;

    // 1. Actualizar campos básicos
    await producto.update(datos);

    // 2. Actualizar categorías si se enviaron (esto borra las viejas y pone las nuevas)
    if (idsCategorias) {
        await producto.setCategorias(idsCategorias);
    }

    return await obtenerProductoPorId(id);
}

async function eliminarProducto(id) {
    const producto = await Producto.findByPk(id);
    if (!producto) return null;

    await producto.destroy();
    return true;
}

// Toggle (Activar/Desactivar sin borrar) - Muy útil para menús
async function toggleEstado(id) {
    const producto = await Producto.findByPk(id);
    if (!producto) return null;
    
    // Invierte el valor booleano de 'activado'
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