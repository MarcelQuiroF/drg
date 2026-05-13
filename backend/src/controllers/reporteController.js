const reporteService = require('../services/reporteService');
const httpCodes = require('../utils/httpCodes');

async function cierreDia(req, res, next) {
    try {
        const { fecha } = req.query;

        if (req.empleado.rol !== 'ADMIN' && req.empleado.rol !== 'CAJERO') {
            return res.status(httpCodes.FORBIDDEN.code).json({ message: "No autorizado para ver reportes financieros." });
        }

        const reporte = await reporteService.generarCierreCaja(fecha);
        
        res.status(httpCodes.OK.code).json({
            message: "Reporte de cierre generado exitosamente.",
            data: reporte
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { cierreDia };