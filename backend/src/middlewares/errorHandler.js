const httpCodes = require('../utils/httpCodes');

// Índices únicos que son reglas de negocio: violarlos es un conflicto (409) con un mensaje claro,
// no un dato mal escrito (400). El nombre es el del índice en la base.
const REGLAS_UNICAS = {
    // RN-10, #30: una llegada por empleado y día (las anuladas no cuentan)
    asistencia_una_llegada_por_dia: 'El empleado ya registró su llegada hoy.'
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
        // Datos que acompañan a un error de negocio para la pantalla (códigos como DIA_CERRADO o
        // DESCUENTO_SUPERA_TOTAL, listas, montos): error.datos (#34, #39)
        ...(err.datos || {}),
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
}

module.exports = {
    notFoundHandler,
    errorHandler
};
