const contenedorJuegoService = require('../services/contenedorJuegoService');
const httpCodes = require('../utils/httpCodes');

async function agregar(req, res, next) {
    try {
        const { orden_id, juego_id, cantidad, comentario } = req.body;

        if (!orden_id || !juego_id || !cantidad) {
            return res.status(httpCodes.BAD_REQUEST.code).json({ 
                message: "Orden ID, Juego ID y Cantidad son obligatorios." 
            });
        }

        const nuevo = await contenedorJuegoService.agregarJuego(req.body);
        res.status(httpCodes.CREATED.code).json(nuevo);
    } catch (error) {
        next(error);
    }
}

async function listar(req, res, next) {
    try {
        const { orden_id } = req.query;
        if (!orden_id) {
            return res.status(httpCodes.BAD_REQUEST.code).json({ message: "Se requiere orden_id." });
        }
        const items = await contenedorJuegoService.listarPorOrden(orden_id);
        res.status(httpCodes.OK.code).json(items);
    } catch (error) {
        next(error);
    }
}

async function finalizarJuego(req, res, next) {
    try {
        const actualizado = await contenedorJuegoService.terminarJuego(req.params.id);
        if (!actualizado) return res.status(httpCodes.NOT_FOUND.code).json({ message: "Registro de juego no encontrado." });
        
        res.status(httpCodes.OK.code).json({ 
            message: "Juego finalizado (Hora fin registrada).", 
            data: actualizado 
        });
    } catch (error) {
        next(error);
    }
}

async function eliminar(req, res, next) {
    try {
        const exito = await contenedorJuegoService.eliminarJuego(req.params.id);
        if (!exito) return res.status(httpCodes.NOT_FOUND.code).json({ message: "Registro no encontrado." });
        
        res.status(httpCodes.OK.code).json({ message: "Juego eliminado de la orden." });
    } catch (error) {
        next(error);
    }
}

module.exports = { agregar, listar, finalizarJuego, eliminar };