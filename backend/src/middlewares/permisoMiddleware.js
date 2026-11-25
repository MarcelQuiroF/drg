'use strict';

const httpCodes = require('../utils/httpCodes');
const { existePermiso, tienePermiso } = require('../config/permisos');

// Exige un permiso por acción (ADR-008). Va después de `authenticate`, que deja el token en
// req.empleado. El ADMIN pasa siempre (RN-17); los demás roles, según config/permisos.js.
//
//   router.post('/:id/finalizar', requierePermiso('ordenes.cobrar'), ordenController.finalizar);
function requierePermiso(permiso) {
    // Un permiso mal escrito detiene el arranque en lugar de responder 403 para siempre
    if (!existePermiso(permiso)) throw new Error(`requierePermiso: el permiso "${permiso}" no está en el catálogo.`);

    const middleware = (req, res, next) => {
        if (!req.empleado) {
            return res.status(httpCodes.UNAUTHORIZED.code).json({ message: 'No autenticado.' });
        }
        if (!tienePermiso(req.empleado.rol, permiso)) {
            return res.status(httpCodes.FORBIDDEN.code).json({
                message: `No tienes permiso para esta acción (${permiso}).`,
                permiso
            });
        }
        next();
    };
    // Se deja a la vista para que las pruebas comparen cada ruta con docs/03_diseno/permisos.md
    middleware.permiso = permiso;
    return middleware;
}

module.exports = { requierePermiso };
