const mesaService = require('../services/mesaService');
const httpCodes = require('../utils/httpCodes');

async function crear(req, res, next) {
    try {
        const { nombre, numero, piso_id } = req.body;
        if (!numero || !piso_id) {
            return res.status(httpCodes.BAD_REQUEST.code).json({ message: "Número y Piso ID son obligatorios." });
        }
        const nueva = await mesaService.crearMesa(req.body);
        res.status(httpCodes.CREATED.code).json(nueva);
    } catch (error) {
        next(error);
    }
}

async function listar(req, res, next) {
    try {
        const { piso_id } = req.query;
        const mesas = await mesaService.listarMesas(piso_id);
        res.status(httpCodes.OK.code).json(mesas);
    } catch (error) {
        next(error);
    }
}

async function actualizar(req, res, next) {
    try {
        const actualizado = await mesaService.actualizarMesa(req.params.id, req.body);
        if (!actualizado) return res.status(httpCodes.NOT_FOUND.code).json({ message: "Mesa no encontrada." });
        res.status(httpCodes.OK.code).json(actualizado);
    } catch (error) {
        next(error);
    }
}

async function eliminar(req, res, next) {
    try {
        const exito = await mesaService.eliminarMesa(req.params.id);
        if (!exito) return res.status(httpCodes.NOT_FOUND.code).json({ message: "Mesa no encontrada." });
        res.status(httpCodes.OK.code).json({ message: "Mesa eliminada." });
    } catch (error) {
        next(error);
    }
}

module.exports = { crear, listar, actualizar, eliminar };