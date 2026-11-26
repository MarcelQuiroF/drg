'use strict';

const descuentoService = require('../services/descuentoService');
const httpCodes = require('../utils/httpCodes');

// GET /descuentos?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&empleado_id=N (#39, solo el ADMIN)
async function listar(req, res, next) {
    try {
        res.status(httpCodes.OK.code).json(await descuentoService.listar(req.query));
    } catch (error) {
        next(error);
    }
}

module.exports = { listar };
