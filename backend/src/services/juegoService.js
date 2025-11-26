const { Juego, Categoria } = require('../models');

async function crearJuego(datos, idsCategorias = []) {
    // 1. Crear el juego base
    const nuevoJuego = await Juego.create(datos);

    // 2. Asignar categorías si existen
    if (idsCategorias && idsCategorias.length > 0) {
        await nuevoJuego.setCategorias(idsCategorias);
    }

    // 3. Devolver juego con sus categorías
    return await obtenerJuegoPorId(nuevoJuego.id);
}

async function listarJuegos(categoriaId = null) {
    const includeOption = {
        model: Categoria,
        attributes: ['id', 'nombre'],
        through: { attributes: [] }
    };

    // Filtro por categoría
    if (categoriaId) {
        includeOption.where = { id: categoriaId };
        includeOption.required = true; 
    }

    return await Juego.findAll({
        include: [includeOption],
        order: [['nombre', 'ASC']]
    });
}

async function obtenerJuegoPorId(id) {
    return await Juego.findByPk(id, {
        include: [{
            model: Categoria,
            attributes: ['id', 'nombre'],
            through: { attributes: [] }
        }]
    });
}

async function actualizarJuego(id, datos, idsCategorias) {
    const juego = await Juego.findByPk(id);
    if (!juego) return null;

    // Actualizamos campos del juego
    await juego.update(datos);

    // Actualizamos categorías si se enviaron
    if (idsCategorias) {
        await juego.setCategorias(idsCategorias);
    }

    return await obtenerJuegoPorId(id);
}

async function eliminarJuego(id) {
    const juego = await Juego.findByPk(id);
    if (!juego) return null;

    await juego.destroy();
    return true;
}

async function toggleEstado(id) {
    const juego = await Juego.findByPk(id);
    if (!juego) return null;
    return await juego.update({ activado: !juego.activado });
}

module.exports = {
    crearJuego,
    listarJuegos,
    obtenerJuegoPorId,
    actualizarJuego,
    eliminarJuego,
    toggleEstado
};