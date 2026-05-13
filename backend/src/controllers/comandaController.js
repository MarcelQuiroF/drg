const comandaService = require('../services/comandaService');
const httpCodes = require('../utils/httpCodes');

async function listar(req, res, next) {
    try {
        const { zona } = req.query; 
        const comandas = await comandaService.listarPendientes(zona);
        res.status(httpCodes.OK.code).json(comandas);
    } catch (error) {
        next(error);
    }
}

async function avanzar(req, res, next) {
    try {
        const { cantidad, estado_origen } = req.body;

        const itemActualizado = await comandaService.avanzarEstado(
            req.params.id, 
            cantidad, 
            estado_origen
        );
        
        res.status(httpCodes.OK.code).json({
            message: "Estado de comanda actualizado.",
            item: itemActualizado
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { listar, avanzar };