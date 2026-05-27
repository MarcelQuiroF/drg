const { Piso } = require('../models');

async function crearPiso(datos) {
    return await Piso.create(datos);
}


async function listarPisos(soloActivos = false) {
    const where = {};
    if (soloActivos) {
        where.activo = true; 
    }

    return await Piso.findAll({
        where,
        order: [['numero', 'ASC']]
    });
}

async function actualizarPiso(id, datos) {
    const piso = await Piso.findByPk(id);
    if (!piso) return null;
    return await piso.update(datos);
}

async function eliminarPiso(id) {
    const piso = await Piso.findByPk(id);
    if (!piso) return null;
    await piso.destroy();
    return true;
}

module.exports = {
    crearPiso,
    listarPisos,
    actualizarPiso,
    eliminarPiso
};