const { Cliente } = require('../models');
const { Op } = require('sequelize');

async function crearCliente(datos) {
    if (datos.ci) {
        const existe = await Cliente.findOne({ where: { ci: datos.ci } });
        if (existe) throw new Error("Ya existe un cliente con ese CI.");
    }
    return await Cliente.create(datos);
}

async function listarClientes(busqueda = '') {
    const opciones = { order: [['nombre', 'ASC']] };
    
    if (busqueda) {
        opciones.where = {
            [Op.or]: [
                { nombre: { [Op.iLike]: `%${busqueda}%` } },
                { ci: { [Op.iLike]: `%${busqueda}%` } }
            ]
        };
    }

    return await Cliente.findAll(opciones);
}

async function obtenerCliente(id) {
    return await Cliente.findByPk(id);
}

async function actualizarCliente(id, datos) {
    const cliente = await Cliente.findByPk(id);
    if (!cliente) return null;
    return await cliente.update(datos);
}

async function eliminarCliente(id) {
    const cliente = await Cliente.findByPk(id);
    if (!cliente) return null;
    await cliente.destroy();
    return true;
}

module.exports = {
    crearCliente,
    listarClientes,
    obtenerCliente,
    actualizarCliente,
    eliminarCliente
};