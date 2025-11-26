const juegoService = require('../services/juegoService');
const httpCodes = require('../utils/httpCodes');

async function crear(req, res, next) {
    try {

        const { categorias, ...datosJuego } = req.body;

        if (!datosJuego.nombre || !datosJuego.precio || !datosJuego.jugadores_min || !datosJuego.jugadores_max) {
            return res.status(httpCodes.BAD_REQUEST.code).json({ 
                message: "Nombre, precio, jugadores mín. y máx. son obligatorios." 
            });
        }

        const nuevo = await juegoService.crearJuego(datosJuego, categorias);
        res.status(httpCodes.CREATED.code).json(nuevo);
    } catch (error) {
        next(error);
    }
}

async function listar(req, res, next) {
    try {

        const { categoria_id } = req.query;
        const juegos = await juegoService.listarJuegos(categoria_id);
        res.status(httpCodes.OK.code).json(juegos);
    } catch (error) {
        next(error);
    }
}

async function actualizar(req, res, next) {
    try {
        const { categorias, ...datos } = req.body;
        const actualizado = await juegoService.actualizarJuego(req.params.id, datos, categorias);
        
        if (!actualizado) {
            return res.status(httpCodes.NOT_FOUND.code).json({ message: "Juego no encontrado." });
        }
        res.status(httpCodes.OK.code).json(actualizado);
    } catch (error) {
        next(error);
    }
}

async function eliminar(req, res, next) {
    try {
        
        const exito = await juegoService.eliminarJuego(req.params.id);
        if (!exito) return res.status(httpCodes.NOT_FOUND.code).json({ message: "Juego no encontrado." });
        
        res.status(httpCodes.OK.code).json({ message: "Juego eliminado." });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    crear,
    listar,
    actualizar,
    eliminar
};