const { Configuracion } = require('../models');
const httpCodes = require('../utils/httpCodes');

async function listar(req, res, next) {
    try {
        const configs = await Configuracion.findAll();
        res.status(httpCodes.OK.code).json(configs);
    } catch (error) { next(error); }
}

async function actualizarMasivo(req, res, next) {
    try {
        const { configuraciones } = req.body;

        if (!Array.isArray(configuraciones)) {
            return res.status(httpCodes.BAD_REQUEST.code).json({ message: "Formato de datos inválido." });
        }

        for (const item of configuraciones) {
            await Configuracion.upsert({
                clave: item.clave,
                valor: parseInt(item.valor)
            });
        }

        res.status(httpCodes.OK.code).json({ message: "Configuración actualizada con éxito." });
    } catch (error) { next(error); }
}

module.exports = { listar, actualizarMasivo };