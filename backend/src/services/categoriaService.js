const { Categoria } = require('../models');

async function crearCategoria(datos) {
    return await Categoria.create(datos);
}

async function listarCategorias() {
    return await Categoria.findAll();
}

async function obtenerCategoriaPorId(id) {
    return await Categoria.findByPk(id);
}

async function actualizarCategoria(id, datos) {
    const categoria = await Categoria.findByPk(id);
    if (!categoria) return null;
    
    return await categoria.update(datos);
}

async function eliminarCategoria(id) {
    const categoria = await Categoria.findByPk(id);
    if (!categoria) return null;

    await categoria.destroy();
    return true;
}

module.exports = {
    crearCategoria,
    listarCategorias,
    obtenerCategoriaPorId,
    actualizarCategoria,
    eliminarCategoria
};