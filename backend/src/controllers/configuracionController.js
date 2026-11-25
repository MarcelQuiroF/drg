const { Configuracion, DescuentoAtraso } = require('../models');
const httpCodes = require('../utils/httpCodes');
const configuracionService = require('../services/configuracionService');

async function listar(req, res, next) {
    try {
        const configs = await Configuracion.findAll();
        res.status(httpCodes.OK.code).json(configs);
    } catch (error) {
        next(error);
    }
}

async function actualizarMasivo(req, res, next) {
    try {
        await configuracionService.actualizarVarias(req.body?.configuraciones);
        res.status(httpCodes.OK.code).json({ message: 'Configuración actualizada con éxito.' });
    } catch (error) {
        next(error);
    }
}

async function listarDescuentosAtraso(req, res, next) {
    try {
        const descuentos = await DescuentoAtraso.findAll({
            order: [['cantidad_tiempo', 'ASC']]
        });
        res.status(httpCodes.OK.code).json(descuentos);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    listar,
    actualizarMasivo,
    listarDescuentosAtraso
};
