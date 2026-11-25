const { verifyToken } = require('../utils/jwt');
const httpCodes = require('../utils/httpCodes');

// 401 = "no sé quién eres" (sin token, token inválido o vencido): el cliente tiene que volver a
// iniciar sesión. 403 = "sé quién eres, pero no tienes permiso" (roleMiddleware). Antes un token
// inválido o vencido respondía 403 y el frontend no volvía al login (#26).
// La cabecera WWW-Authenticate es la que pide el estándar de los tokens Bearer (RFC 6750).
function noAutenticado(res, mensaje, errorBearer) {
    const desafio = errorBearer ? `Bearer error="${errorBearer}"` : 'Bearer';
    return res.status(httpCodes.UNAUTHORIZED.code).set('WWW-Authenticate', desafio).json({ message: mensaje });
}

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return noAutenticado(res, 'Acceso denegado. Se requiere un token de autenticación (Bearer).');
    }

    const token = authHeader.split(' ')[1];
    const { payload, vencido } = verifyToken(token);

    if (!payload) {
        const mensaje = vencido
            ? 'La sesión venció. Vuelva a iniciar sesión.'
            : 'Token inválido. Vuelva a iniciar sesión.';
        return noAutenticado(res, mensaje, 'invalid_token');
    }

    req.empleado = payload;

    next();
}

module.exports = {
    authenticate
};
