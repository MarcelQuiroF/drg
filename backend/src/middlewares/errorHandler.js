const httpCodes = require('../utils/httpCodes');

// Índices únicos que son reglas de negocio: violarlos es un conflicto (409) con un mensaje claro,
// no un dato mal escrito (400). El nombre es el del índice en la base.
const REGLAS_UNICAS = {
    // RN-10, #30: una llegada por empleado y día (las anuladas no cuentan)
    asistencia_una_llegada_por_dia: 'El empleado ya registró su llegada hoy.',
    // RF-22, #34: un solo día abierto a la vez y una jornada por fecha
    jornada_una_abierta: 'Ya hay un día abierto.',
    jornada_un_dia_por_fecha: 'El día de hoy ya se abrió. Para corregir un día cerrado, el administrador lo reabre.'
};

function notFoundHandler(req, res, next) {
    const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
    error.status = httpCodes.NOT_FOUND.code;
    next(error);
}

function errorHandler(err, req, res, next) {
    let statusCode = err.status || httpCodes.INTERNAL_SERVER_ERROR.code;

    let errorMessage = err.message || httpCodes.INTERNAL_SERVER_ERROR.message;

    const reglaUnica = err.name === 'SequelizeUniqueConstraintError' && REGLAS_UNICAS[err.parent?.constraint];

    if (reglaUnica) {
        statusCode = httpCodes.CONFLICT.code;
        errorMessage = reglaUnica;
    } else if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        statusCode = httpCodes.BAD_REQUEST.code;
        errorMessage = err.errors ? err.errors.map((e) => e.message).join('; ') : 'Error de validación de datos.';
    } else if (err.name === 'SequelizeDatabaseError') {
        statusCode = httpCodes.INTERNAL_SERVER_ERROR.code;
        errorMessage = 'Error en la base de datos.';
    } else if (err.message === 'El Piso especificado no existe.') {
        statusCode = httpCodes.BAD_REQUEST.code;
    }

    res.status(statusCode).json({
        success: false,
        status: statusCode,
        message: errorMessage,
        // Datos para la pantalla (por ejemplo, las órdenes que impiden cerrar el día, #34)
        ...(err.datos || {}),
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
}

module.exports = {
    notFoundHandler,
    errorHandler
};
