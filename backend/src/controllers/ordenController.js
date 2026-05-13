const ordenService = require('../services/ordenService');
const httpCodes = require('../utils/httpCodes');

async function crear(req, res, next) {
    try {
        const { mesa_id } = req.body;
        if (!mesa_id) {
            return res.status(httpCodes.BAD_REQUEST.code).json({ message: "Se requiere el ID de la mesa." });
        }

        const nuevaOrden = await ordenService.crearOrden(mesa_id, req.empleado.id);
        
        res.status(httpCodes.CREATED.code).json({
            message: "Orden abierta exitosamente.",
            orden: nuevaOrden
        });
    } catch (error) {
        next(error);
    }
}

async function listarDescuentos(req, res, next) {
    try {
        const { id } = req.params;
        const descuentos = await ordenService.obtenerDescuentosPorOrden(id);
        res.status(httpCodes.OK.code).json(descuentos);
    } catch (error) {
        next(error);
    }
}

async function obtenerPorId(req, res, next) {
    try {
        const orden = await ordenService.obtenerOrdenPorId(req.params.id);
        
        if (!orden) {
            return res.status(httpCodes.NOT_FOUND.code).json({ message: "Orden no encontrada." });
        }

        res.status(httpCodes.OK.code).json(orden);
    } catch (error) {
        next(error);
    }
}

async function aplicarDescuento(req, res, next) {
    try {
        const { id } = req.params;
        const { porcentaje, monto, comentario } = req.body;

        if (!porcentaje && !monto) {
            return res.status(httpCodes.BAD_REQUEST.code).json({ 
                message: "Debe enviar un porcentaje o un monto fijo." 
            });
        }

        const resultado = await ordenService.aplicarDescuento(id, { porcentaje, monto, comentario });
        
        res.status(httpCodes.OK.code).json({
            message: "Descuento aplicado correctamente.",
            descuento: resultado
        });
    } catch (error) {
        next(error);
    }
}

async function listar(req, res, next) {
    try {
        const filtros = {
            finalizado: req.query.finalizado,
            mesa_id: req.query.mesa_id
        };
        const ordenes = await ordenService.listarOrdenes(filtros);
        res.status(httpCodes.OK.code).json(ordenes);
    } catch (error) {
        next(error);
    }
}

async function finalizar(req, res, next) {
    try {
        const orden = await ordenService.finalizarOrden(req.params.id);
        res.status(httpCodes.OK.code).json({
            message: "Orden finalizada y mesa liberada.",
            orden
        });
    } catch (error) {
        next(error);
    }
}

async function eliminar(req, res, next) {
    try {
        const exito = await ordenService.eliminarOrden(req.params.id);
        if (!exito) return res.status(httpCodes.NOT_FOUND.code).json({ message: "Orden no encontrada." });
        res.status(httpCodes.OK.code).json({ message: "Orden eliminada." });
    } catch (error) {
        next(error);
    }
}

async function quitarDescuento(req, res, next) {
    try {
        const { ordenId, descuentoId } = req.params;
        await ordenService.removerDescuento(ordenId, descuentoId);
        res.status(httpCodes.OK.code).json({ message: "Descuento eliminado." });
    } catch (error) {
        console.error("ERROR REAL EN QUITAR DESCUENTO:", error); 
        next(error);
    }
}

module.exports = {
    crear,
    quitarDescuento,
    listar,
    finalizar,
    eliminar,
    obtenerPorId,
    listarDescuentos,
    aplicarDescuento
};