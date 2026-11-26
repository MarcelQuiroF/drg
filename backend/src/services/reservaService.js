const { Reserva, Cliente, Mesa, Configuracion } = require('../models');
const { Op } = require('sequelize');

async function verificarDisponibilidad(mesaId, fechaHora, excludeReservaId = null) {
    const configBuffer = await Configuracion.findOne({ where: { clave: 'ventana_bloqueo' } });
    const bufferMinutes = configBuffer ? configBuffer.valor : 120;
    const bufferMs = bufferMinutes * 60 * 1000;

    const fechaInicio = new Date(fechaHora);
    const rangoInicio = new Date(fechaInicio.getTime() - bufferMs);
    const rangoFin = new Date(fechaInicio.getTime() + bufferMs);

    const conflicto = await Reserva.findOne({
        where: {
            mesa_id: mesaId,
            id: { [Op.ne]: excludeReservaId },
            estado: { [Op.in]: ['PENDIENTE', 'LLEGO'] },
            hora: {
                [Op.between]: [rangoInicio, rangoFin]
            }
        }
    });

    return !conflicto;
}

async function procesarExpiraciones() {
    const config = await Configuracion.findOne({ where: { clave: 'minutos_tolerancia' } });
    const toleranciaMins = config ? config.valor : 20;

    const limiteExpiracion = new Date(new Date().getTime() - toleranciaMins * 60 * 1000);

    await Reserva.update(
        { estado: 'EXPIRADA' },
        {
            where: {
                estado: 'PENDIENTE',
                hora: { [Op.lt]: limiteExpiracion }
            }
        }
    );
}

async function crearReserva(datos) {
    const cliente = await Cliente.findByPk(datos.cliente_id);
    if (!cliente) throw new Error('Cliente no encontrado.');

    const mesa = await Mesa.findByPk(datos.mesa_id);
    if (!mesa) throw new Error('Mesa no encontrada.');

    if (new Date(datos.hora) <= new Date()) {
        throw new Error('La reserva debe ser para una fecha futura.');
    }

    const disponible = await verificarDisponibilidad(datos.mesa_id, datos.hora);
    if (!disponible) {
        throw new Error('La mesa ya está reservada en un horario cercano.');
    }

    const reserva = await Reserva.create(datos);
    return { reserva, aviso: avisoDeCapacidad(reserva.cantidad_personas, mesa) };
}

// RF-25 (#40): superar la capacidad de la mesa no se bloquea (se pueden juntar sillas; decisión de
// Marcelo, ⚠ confirmar con el dueño). Se devuelve un aviso para que la pantalla lo muestre.
function avisoDeCapacidad(personas, mesa) {
    if (personas == null || !mesa || personas <= mesa.cantidadMaxima) return null;
    return `La reserva es para ${personas} personas y la mesa ${mesa.nombre} tiene capacidad para ${mesa.cantidadMaxima}.`;
}

async function listarReservas(filtros = {}) {
    await procesarExpiraciones();

    const whereClause = {};

    if (filtros.fecha) {
        const [anio, mes, dia] = filtros.fecha.split('-');
        const inicioDia = new Date(anio, mes - 1, dia, 0, 0, 0);
        const finDia = new Date(anio, mes - 1, dia, 23, 59, 59, 999);

        whereClause.hora = { [Op.between]: [inicioDia, finDia] };
    } else {
        whereClause.estado = 'PENDIENTE';
    }

    return await Reserva.findAll({
        where: whereClause,
        include: [
            { model: Cliente, attributes: ['nombre', 'telefono'] },
            // cantidadMaxima: la lista marca las reservas con más personas que la capacidad (#40)
            { model: Mesa, attributes: ['nombre', 'numero', 'cantidadMaxima'] }
        ],
        order: [['hora', 'ASC']]
    });
}

async function actualizarReserva(id, datos) {
    const reserva = await Reserva.findByPk(id);
    if (!reserva) throw new Error('Reserva no encontrada.');

    if (datos.hora || datos.mesa_id) {
        const mesaId = datos.mesa_id || reserva.mesa_id;
        const horaNueva = datos.hora || reserva.hora;

        const disponible = await verificarDisponibilidad(mesaId, horaNueva);

        if (
            !disponible &&
            (mesaId !== reserva.mesa_id || new Date(horaNueva).getTime() !== new Date(reserva.hora).getTime())
        ) {
            throw new Error('La mesa ya tiene una reserva en ese horario.');
        }
    }

    const actualizada = await reserva.update(datos);
    const mesa = await Mesa.findByPk(actualizada.mesa_id);
    return { reserva: actualizada, aviso: avisoDeCapacidad(actualizada.cantidad_personas, mesa) };
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
