'use strict';

const jornadaService = require('../services/jornadaService');
const httpCodes = require('../utils/httpCodes');

async function actual(req, res, next) {
    try {
        res.status(httpCodes.OK.code).json(await jornadaService.actual());
    } catch (error) {
        next(error);
    }
}

async function abrir(req, res, next) {
    try {
        const jornada = await jornadaService.abrir(req.body);
        res.status(httpCodes.CREATED.code).json({ message: 'Día abierto.', jornada });
    } catch (error) {
        next(error);
    }
}

async function cerrar(req, res, next) {
    try {
        const jornada = await jornadaService.cerrar(req.body);
        res.status(httpCodes.OK.code).json({ message: 'Día cerrado.', jornada });
    } catch (error) {
        next(error);
    }
}

module.exports = { actual, abrir, cerrar };
