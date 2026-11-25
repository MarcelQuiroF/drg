const { Juego, Categoria, sequelize } = require('../models');

// Ids de categoría sin repetir (un id repetido chocaría con la clave primaria de juego_categoria)
const idsUnicos = (ids) => [...new Set(ids.map(Number))];

// Reemplaza las categorías del juego por las recibidas. La asociación se llama `Categoria`
// (Sequelize no pluraliza el nombre del modelo), así que el método es `setCategoria`, no
// `setCategorias` (#24). `setCategoria` borra las relaciones que sobran y crea las nuevas;
// como juego_categoria ya no tiene borrado lógico (#78), volver a asignar una categoría no choca.
async function guardarCategorias(juego, idsCategorias, transaction) {
    const ids = idsUnicos(idsCategorias);
    const existentes = await Categoria.count({ where: { id: ids }, transaction });
    if (existentes !== ids.length) {
        const error = new Error('Alguna de las categorías no existe.');
        error.status = 400;
        throw error;
    }
    await juego.setCategoria(ids, { transaction });
}

// Juego y categorías se guardan juntos: si algo falla no queda un juego a medias (#24)
async function crearJuego(datos, idsCategorias = []) {
    const nuevoJuego = await sequelize.transaction(async (t) => {
        const juego = await Juego.create(datos, { transaction: t });
        if (idsCategorias) await guardarCategorias(juego, idsCategorias, t);
        return juego;
    });

    return await obtenerJuegoPorId(nuevoJuego.id);
}

async function listarJuegos(categoriaId = null) {
    const includeOption = {
        model: Categoria,
        attributes: ['id', 'nombre'],
        through: { attributes: [] }
    };

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
        include: [
            {
                model: Categoria,
                attributes: ['id', 'nombre'],
                through: { attributes: [] }
            }
        ]
    });
}

// Si llegan categorías, reemplazan a las anteriores; todo en la misma transacción (#24)
async function actualizarJuego(id, datos, idsCategorias) {
    const actualizado = await sequelize.transaction(async (t) => {
        const juego = await Juego.findByPk(id, { transaction: t });
        if (!juego) return null;

        await juego.update(datos, { transaction: t });
        if (idsCategorias) await guardarCategorias(juego, idsCategorias, t);
        return juego;
    });

    if (!actualizado) return null;
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
