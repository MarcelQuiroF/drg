const { Mesa, Piso, Reserva, sequelize } = require('../models');
const { Op } = require('sequelize');

async function crearMesa(datos) {

    const piso = await Piso.findByPk(datos.piso_id);
    if (!piso) throw new Error("El Piso especificado no existe.");

    return await Mesa.create(datos);
}


async function listarMesas(pisoId = null) {
    await actualizarEstadosReservas();

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

async function actualizarEstadosReservas() {
    const ahora = new Date();
    

    const limiteVencimiento = new Date(ahora.getTime() - 30 * 60 * 1000); 

    const ventanaInicio = limiteVencimiento; 
    const ventanaFin = new Date(ahora.getTime() + 60 * 60 * 1000); 

    const reservasVencidas = await Reserva.findAll({
        where: {
            hora: { [Op.lt]: limiteVencimiento } 
        },
        include: [{ 
            model: Mesa, 
            where: { estado: 3 } 
        }]
    });

    if (reservasVencidas.length > 0) {
        const idsLiberar = reservasVencidas.map(r => r.mesa_id);
        await Mesa.update(
            { estado: 0 }, 
            { where: { id: { [Op.in]: idsLiberar } } }
        );
        console.log(`🧹 Liberadas ${idsLiberar.length} mesas por inasistencia.`);
    }

    const reservasActivas = await Reserva.findAll({
        where: {
            hora: { [Op.between]: [ventanaInicio, ventanaFin] }
        },
        include: [{ 
            model: Mesa, 
            where: { estado: 0 }
        }]
    });

    if (reservasActivas.length > 0) {
        const idsReservar = reservasActivas.map(r => r.mesa_id);
        await Mesa.update(
            { estado: 3 }, 
            { where: { id: { [Op.in]: idsReservar } } }
        );
    }
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