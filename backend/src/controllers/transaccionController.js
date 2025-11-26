const transaccionService = require('../services/transaccionService');
const httpCodes = require('../utils/httpCodes');

async function crear(req, res, next) {
    try {
        const { orden_id, cantidad, tipo } = req.body;

        if (!orden_id || !cantidad || !tipo) {
            return res.status(httpCodes.BAD_REQUEST.code).json({ 
                message: "Orden ID, cantidad y tipo de pago son obligatorios." 
            });
        }

        const resultado = await transaccionService.registrarPago(req.body);
        
        const mensaje = resultado.info_pago.estado === "COMPLETADO" 
            ? "Pago registrado. ¡Orden finalizada y mesa liberada!" 
            : "Pago parcial registrado.";

        res.status(httpCodes.CREATED.code).json({
            message: mensaje,
            data: resultado
        });
    } catch (error) {
        next(error);
    }
}

async function listar(req, res, next) {
    try {
        const { orden_id } = req.query;
        if (!orden_id) return res.status(httpCodes.BAD_REQUEST.code).json({ message: "Falta orden_id." });

        const pagos = await transaccionService.listarPorOrden(orden_id);
        res.status(httpCodes.OK.code).json(pagos);
    } catch (error) {
        next(error);
    }
}

async function anular(req, res, next) {
    try {

        if (req.empleado.rol === 'MESERO') {
            return res.status(httpCodes.FORBIDDEN.code).json({ message: "No autorizado." });
        }

        const exito = await transaccionService.anularPago(req.params.id);
        if (!exito) return res.status(httpCodes.NOT_FOUND.code).json({ message: "Transacción no encontrada." });

        res.status(httpCodes.OK.code).json({ message: "Pago anulado correctamente." });
    } catch (error) {
        next(error);
    }
}

module.exports = { crear, listar, anular };