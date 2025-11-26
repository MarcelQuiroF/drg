
module.exports = {
    OK: { code: 200, message: 'Solicitud exitosa.' },
    CREATED: { code: 201, message: 'Recurso creado exitosamente.' },
    NO_CONTENT: { code: 204, message: 'Solicitud exitosa sin contenido para devolver.' },

    BAD_REQUEST: { code: 400, message: 'La solicitud contiene sintaxis inválida o parámetros incorrectos.' },
    UNAUTHORIZED: { code: 401, message: 'No autenticado o credenciales inválidas.' },
    FORBIDDEN: { code: 403, message: 'Acceso prohibido. El usuario no tiene permisos.' },
    NOT_FOUND: { code: 404, message: 'El recurso solicitado no fue encontrado.' },
    CONFLICT: { code: 409, message: 'Conflicto con el estado actual del recurso (ej. registro duplicado).' },
    
    INTERNAL_SERVER_ERROR: { code: 500, message: 'Error interno del servidor.' },
    SERVICE_UNAVAILABLE: { code: 503, message: 'El servicio no está disponible temporalmente.' },
};