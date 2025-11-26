const httpCodes = require('../utils/httpCodes');

function notFoundHandler(req, res, next) {
    const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
    error.status = httpCodes.NOT_FOUND.code;
    next(error); 
}

function errorHandler(err, req, res, next) {
    let statusCode = err.status || httpCodes.INTERNAL_SERVER_ERROR.code;
    
    let errorMessage = err.message || httpCodes.INTERNAL_SERVER_ERROR.message;

    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        statusCode = httpCodes.BAD_REQUEST.code;
        errorMessage = err.errors ? err.errors.map(e => e.message).join('; ') : 'Error de validación de datos.';
    } else if (err.name === 'SequelizeDatabaseError') {
        statusCode = httpCodes.INTERNAL_SERVER_ERROR.code;
        errorMessage = 'Error en la base de datos.'; 
    }
    else if (err.message === "El Piso especificado no existe.") {
         statusCode = httpCodes.BAD_REQUEST.code;
    }

    res.status(statusCode).json({
        success: false,
        status: statusCode,
        message: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
}

module.exports = {
    notFoundHandler,
    errorHandler
};