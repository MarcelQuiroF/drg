const httpCodes = require('../utils/httpCodes');

function authorize(rolesPermitidos) {
    return (req, res, next) => {
        if (!req.empleado) {
            return res.status(httpCodes.UNAUTHORIZED.code).json({ message: "No autenticado." });
        }

        if (!rolesPermitidos.includes(req.empleado.rol)) {
            return res.status(httpCodes.FORBIDDEN.code).json({ 
                message: "Acceso prohibido. No tienes el rol necesario." 
            });
        }

        next();
    };
}

module.exports = { authorize };