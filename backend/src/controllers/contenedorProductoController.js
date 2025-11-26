const contenedorProductoService = require('../services/contenedorProductoService');
const httpCodes = require('../utils/httpCodes');

async function agregar(req, res, next) {
    try {
        const { orden_id, producto_id, cantidad, comentario } = req.body;

        if (!orden_id || !producto_id || !cantidad) {
            return res.status(httpCodes.BAD_REQUEST.code).json({ 
                message: "Orden ID, Producto ID y Cantidad son obligatorios." 
            });
        }

        const nuevoItem = await contenedorProductoService.agregarItem(req.body);
        res.status(httpCodes.CREATED.code).json(nuevoItem);
    } catch (error) {
        next(error);
    }
}

async function listar(req, res, next) {
    try {
        const { orden_id } = req.query;
        if (!orden_id) {
            return res.status(httpCodes.BAD_REQUEST.code).json({ message: "Se requiere orden_id en la URL." });
        }

        const items = await contenedorProductoService.listarPorOrden(orden_id);
        res.status(httpCodes.OK.code).json(items);
    } catch (error) {
        next(error);
    }
}

async function actualizar(req, res, next) {
    try {
        const item = await contenedorProductoService.actualizarItem(req.params.id, req.body);
        if (!item) return res.status(httpCodes.NOT_FOUND.code).json({ message: "Item no encontrado." });
        
        res.status(httpCodes.OK.code).json(item);
    } catch (error) {
        next(error);
    }
}

async function eliminar(req, res, next) {
    try {
        const exito = await contenedorProductoService.eliminarItem(req.params.id);
        if (!exito) return res.status(httpCodes.NOT_FOUND.code).json({ message: "Item no encontrado." });
        
        res.status(httpCodes.OK.code).json({ message: "Item eliminado de la orden." });
    } catch (error) {
        next(error);
    }
}

module.exports = { agregar, listar, actualizar, eliminar };