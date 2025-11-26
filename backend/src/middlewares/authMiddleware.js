const { verifyToken } = require('../utils/jwt');
const httpCodes = require('../utils/httpCodes');


function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(httpCodes.UNAUTHORIZED.code).json({
            message: "Acceso denegado. Se requiere un token de autenticación (Bearer)."
        });
    }

    const token = authHeader.split(' ')[1];

    const decodedPayload = verifyToken(token);

    if (!decodedPayload) {
        return res.status(httpCodes.FORBIDDEN.code).json({
            message: "Token inválido o expirado. Vuelva a iniciar sesión."
        });
    }

    req.empleado = decodedPayload;

    next();
}

module.exports = {
    authenticate,
};