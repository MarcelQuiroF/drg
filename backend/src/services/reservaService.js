const { Reserva, Cliente, Mesa } = require('../models');
const { Op } = require('sequelize');


async function verificarDisponibilidad(mesaId, fechaHora) {
    const fechaInicio = new Date(fechaHora);

    const dosHorasAntes = new Date(fechaInicio.getTime() - 2 * 60 * 60 * 1000);
    const dosHorasDespues = new Date(fechaInicio.getTime() + 2 * 60 * 60 * 1000);

    const conflicto = await Reserva.findOne({
        where: {
            mesa_id: mesaId,
            hora: {
                [Op.between]: [dosHorasAntes, dosHorasDespues]
            }
        }
    });

    return !conflicto; 
}

async function crearReserva(datos) {

    const cliente = await Cliente.findByPk(datos.cliente_id);
    if (!cliente) throw new Error("Cliente no encontrado.");

    const mesa = await Mesa.findByPk(datos.mesa_id);
    if (!mesa) throw new Error("Mesa no encontrada.");

    if (new Date(datos.hora) <= new Date()) {
        throw new Error("La reserva debe ser para una fecha futura.");
    }

    const disponible = await verificarDisponibilidad(datos.mesa_id, datos.hora);
    if (!disponible) {
        throw new Error("La mesa ya está reservada en un horario cercano (±2 horas).");
    }

    return await Reserva.create(datos);
}

async function listarReservas(filtros = {}) {
    const whereClause = {};


    if (filtros.fecha) {
        const [anio, mes, dia] = filtros.fecha.split('-');
        const inicioDia = new Date(anio, mes - 1, dia, 0, 0, 0);
        const finDia = new Date(anio, mes - 1, dia, 23, 59, 59, 999);
        
        whereClause.hora = { [Op.between]: [inicioDia, finDia] };
    } 

    else {

        const hace30Min = new Date(new Date().getTime() - 30 * 60 * 1000);


        whereClause.hora = {
            [Op.gte]: hace30Min
        };
    }

    return await Reserva.findAll({
        where: whereClause,
        include: [
            { model: Cliente, attributes: ['nombre', 'telefono'] },
            { model: Mesa, attributes: ['nombre', 'numero'] }
        ],
        order: [['hora', 'ASC']]
    });
}

async function actualizarReserva(id, datos) {
    const reserva = await Reserva.findByPk(id);
    if (!reserva) throw new Error("Reserva no encontrada.");


    if (datos.hora || datos.mesa_id) {

        const mesaId = datos.mesa_id || reserva.mesa_id;
        const horaNueva = datos.hora || reserva.hora;

        const disponible = await verificarDisponibilidad(mesaId, horaNueva);
        if (!disponible && (mesaId !== reserva.mesa_id || new Date(horaNueva).getTime() !== new Date(reserva.hora).getTime())) {

        }
    }

    return await reserva.update(datos);
}

async function obtenerReservaPorId(id) {
    return await Reserva.findByPk(id, {
        include: [Cliente, Mesa]
    });
}

async function eliminarReserva(id) {
    const reserva = await Reserva.findByPk(id);
    if (!reserva) return null;
    await reserva.destroy();
    return true;
}

module.exports = {
    crearReserva,
    listarReservas,
    eliminarReserva,
    actualizarReserva,
    obtenerReservaPorId
};