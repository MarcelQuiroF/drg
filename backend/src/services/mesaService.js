const { Mesa, Piso, Reserva, Configuracion, sequelize } = require('../models');
const { Op } = require('sequelize');

async function crearMesa(datos) {

    const piso = await Piso.findByPk(datos.piso_id);
    if (!piso) throw new Error("El Piso especificado no existe.");

    return await Mesa.create(datos);
}


async function listarMesas(pisoId = null) {
    await actualizarEstadosReservas();
    const ahora = new Date();

    const queryOptions = {
        include: [
            { model: Piso, attributes: ['nombre'] },
            { 
                model: Reserva, 
                where: { 
                    estado: 'PENDIENTE',
                    hora: { [Op.gt]: ahora } 
                },
                required: false,
                attributes: ['hora'],
            }
        ],
        order: [
            ['numero', 'ASC'],
            [Reserva, 'hora', 'ASC'] 
        ]
    };

    if (pisoId) queryOptions.where = { piso_id: pisoId };

    return await Mesa.findAll(queryOptions);
}

async function actualizarMesa(id, datos) {
    const mesa = await Mesa.findByPk(id);
    if (!mesa) return null;
    return await mesa.update(datos);
}

async function actualizarEstadosReservas() {
    const ahora = new Date();
    
    const [confTolerancia, confLlegada] = await Promise.all([
        Configuracion.findOne({ where: { clave: 'minutos_tolerancia' } }),
        Configuracion.findOne({ where: { clave: 'ventana_llegada' } })
    ]);

    const toleranciaMins = confTolerancia ? confTolerancia.valor : 20;
    const anticipacionMins = confLlegada ? confLlegada.valor : 30;

    const limiteExpiracion = new Date(ahora.getTime() - (toleranciaMins * 60 * 1000));

    const reservasVencidas = await Reserva.findAll({
        where: {
            estado: 'PENDIENTE',
            hora: { [Op.lt]: limiteExpiracion }
        }
    });

    if (reservasVencidas.length > 0) {
        const idsMesas = reservasVencidas.map(r => r.mesa_id);
        await Reserva.update({ estado: 'EXPIRADA' }, { where: { id: { [Op.in]: reservasVencidas.map(r => r.id) } } });
        await Mesa.update({ estado: 0 }, { where: { id: { [Op.in]: idsMesas }, estado: 3 } });
    }

    const limiteFuturo = new Date(ahora.getTime() + (anticipacionMins * 60 * 1000));

    const reservasProximas = await Reserva.findAll({
        where: {
            estado: 'PENDIENTE',
            hora: { [Op.between]: [limiteExpiracion, limiteFuturo] }
        }
    });

    if (reservasProximas.length > 0) {
        const idsMesasReservar = reservasProximas.map(r => r.mesa_id);
        await Mesa.update({ estado: 3 }, { where: { id: { [Op.in]: idsMesasReservar }, estado: 0 } });
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