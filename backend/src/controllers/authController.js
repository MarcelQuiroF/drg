const authService = require('../services/authService');
const httpCodes = require('../utils/httpCodes');

async function loginHandler(req, res, next) {
    const { ci, contrasenia } = req.body;

    if (!ci || !contrasenia) {
        return res.status(httpCodes.BAD_REQUEST.code).json({
            message: "CI y contraseña son requeridos."
        });
    }

    try {
        const result = await authService.login(ci, contrasenia);

        if (!result) {
            return res.status(httpCodes.UNAUTHORIZED.code).json({
                message: "CI o contraseña incorrectos, o usuario inactivo."
            });
        }

        return res.status(httpCodes.OK.code).json({
            message: "Login exitoso",
            token: result.token,
            empleado: result.empleado
        });

    } catch (error) {
        next(error); 
    }
}

module.exports = {
    loginHandler,
};