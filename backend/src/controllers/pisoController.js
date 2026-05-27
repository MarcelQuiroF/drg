const pisoService = require('../services/pisoService');
const httpCodes = require('../utils/httpCodes');

async function crear(req, res, next) {
    try {
        const { nombre, numero } = req.body;
        if (!nombre || numero === undefined || numero === null || isNaN(numero)) {
            return res.status(httpCodes.BAD_REQUEST.code).json({ message: "Nombre y número válido son obligatorios." });
        }
        const nuevo = await pisoService.crearPiso(req.body);
        res.status(httpCodes.CREATED.code).json(nuevo);
    } catch (error) {
        next(error);
    }
}

async function listar(req, res, next) {
    try {
        const soloActivos = req.query.activo === 'true';
        const pisos = await pisoService.listarPisos(soloActivos);
        res.status(httpCodes.OK.code).json(pisos);
    } catch (error) {
        next(error);
    }
}

async function actualizar(req, res, next) {
    try {
        const actualizado = await pisoService.actualizarPiso(req.params.id, req.body);
        if (!actualizado) {
            return res.status(httpCodes.NOT_FOUND.code).json({ message: "Piso no encontrado." });
        }
        res.status(httpCodes.OK.code).json(actualizado);
    } catch (error) {
        next(error);
    }
}

async function eliminar(req, res, next) {
    try {
        const exito = await pisoService.eliminarPiso(req.params.id);
        if (!exito) return res.status(httpCodes.NOT_FOUND.code).json({ message: "Piso no encontrado." });
        res.status(httpCodes.OK.code).json({ message: "Piso eliminado." });
    } catch (error) {
        next(error);
    }
}

module.exports = { crear, listar, actualizar, eliminar };