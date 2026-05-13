const reservaService = require('../services/reservaService');
const httpCodes = require('../utils/httpCodes');

async function crear(req, res, next) {
    try {
        const { cliente_id, mesa_id, hora } = req.body;
        if (!cliente_id || !mesa_id || !hora) {
            return res.status(httpCodes.BAD_REQUEST.code).json({ 
                message: "Cliente, Mesa y Hora son obligatorios." 
            });
        }

        const nueva = await reservaService.crearReserva(req.body);
        res.status(httpCodes.CREATED.code).json(nueva);
    } catch (error) {
        if (error.message === "La reserva debe ser para una fecha futura." || 
            error.message.includes("ya está reservada")) {
            return res.status(httpCodes.BAD_REQUEST.code).json({ message: error.message });
        }
        next(error);
    }
}

async function listar(req, res, next) {
    try {
        const { fecha } = req.query;
        const reservas = await reservaService.listarReservas({ fecha });
        res.status(httpCodes.OK.code).json(reservas);
    } catch (error) {
        next(error);
    }
}

async function eliminar(req, res, next) {
    try {
        const exito = await reservaService.eliminarReserva(req.params.id);
        if (!exito) return res.status(httpCodes.NOT_FOUND.code).json({ message: "Reserva no encontrada." });
        res.status(httpCodes.OK.code).json({ message: "Reserva cancelada." });
    } catch (error) {
        next(error);
    }
}

async function obtenerPorId(req, res, next) {
    try {
        const reserva = await reservaService.obtenerReservaPorId(req.params.id);
        if (!reserva) return res.status(httpCodes.NOT_FOUND.code).json({ message: "Reserva no encontrada" });
        res.status(httpCodes.OK.code).json(reserva);
    } catch (error) { next(error); }
}

async function actualizar(req, res, next) {
    try {
        const actualizado = await reservaService.actualizarReserva(req.params.id, req.body);
        res.status(httpCodes.OK.code).json({ message: "Reserva actualizada.", data: actualizado });
    } catch (error) { next(error); }
}

module.exports = { crear, listar, eliminar, obtenerPorId, actualizar };