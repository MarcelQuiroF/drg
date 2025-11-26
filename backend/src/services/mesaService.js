const { Mesa, Piso } = require('../models');

async function crearMesa(datos) {
    // Validar que el piso exista antes de asignar
    const piso = await Piso.findByPk(datos.piso_id);
    if (!piso) throw new Error("El Piso especificado no existe.");

    return await Mesa.create(datos);
}

// Listar mesas con opción de filtrar por piso
async function listarMesas(pisoId = null) {
    const queryOptions = {
        include: [{ model: Piso, attributes: ['nombre'] }],
        order: [['numero', 'ASC']]
    };

    if (pisoId) {
        queryOptions.where = { piso_id: pisoId };
    }

    return await Mesa.findAll(queryOptions);
}

async function actualizarMesa(id, datos) {
    const mesa = await Mesa.findByPk(id);
    if (!mesa) return null;
    return await mesa.update(datos);
}

async function eliminarMesa(id) {
    const mesa = await Mesa.findByPk(id);
    if (!mesa) return null;
    await mesa.destroy();
    return true;
}

module.exports = {
    crearMesa,
    listarMesas,
    actualizarMesa,
    eliminarMesa
};