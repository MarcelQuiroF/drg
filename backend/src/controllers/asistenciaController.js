const asistenciaService = require('../services/asistenciaService');
const httpCodes = require('../utils/httpCodes');

async function marcarLlegada(req, res, next) {
    try {
        const { ci, contrasenia } = req.body;

        if (!ci || !contrasenia) {
            return res.status(httpCodes.BAD_REQUEST.code).json({ 
                message: "CI y Contraseña son requeridos para marcar asistencia." 
            });
        }

        const nuevaAsistencia = await asistenciaService.registrarLlegada(ci, contrasenia);
        
        // Mensaje dinámico si llegó tarde
        const mensaje = nuevaAsistencia.descuento_id 
            ? "Llegada registrada con ATRASO (Descuento aplicado)." 
            : "Llegada registrada exitosamente (A tiempo).";

        res.status(httpCodes.CREATED.code).json({
            message: mensaje,
            data: nuevaAsistencia
        });

    } catch (error) {
        next(error);
    }
}

async function listar(req, res, next) {
    try {

        const { pendientes, fecha } = req.query;
        
        // Si no envían fecha, usamos HOY por defecto
        const fechaFiltro = fecha || new Date().toISOString().split('T')[0]; 

        const asistencias = await asistenciaService.listarAsistencias(
            pendientes === 'true', 
            fechaFiltro
        );
        
        res.status(httpCodes.OK.code).json(asistencias);
    } catch (error) {
        next(error);
    }
}

async function aprobar(req, res, next) {
    try {
        const actualizado = await asistenciaService.aprobarAsistencia(req.params.id);
        res.status(httpCodes.OK.code).json({ 
            message: "Asistencia aprobada/verificada.", 
            data: actualizado 
        });
    } catch (error) {
        next(error);
    }
}

async function verHorarioHoy(req, res, next) {
    try {
        const horario = await asistenciaService.obtenerHorarioHoy();
        
        if (!horario) {
            return res.status(httpCodes.OK.code).json({ mensaje: "Sin horario" });
        }

        res.status(httpCodes.OK.code).json(horario);
    } catch (error) {
        next(error);
    }
}

module.exports = { marcarLlegada, listar, aprobar, verHorarioHoy };