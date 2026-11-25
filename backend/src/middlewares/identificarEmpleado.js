'use strict';

// RF-43 (#30): la llegada la registra el propio empleado con su CI y su contraseña. Quien tiene
// la sesión abierta (cajero, mesero) presta la pantalla, pero no puede registrar a otro.
//
// Va como middleware de POST /asistencias: deja en req.body.empleado_id el empleado de esas
// credenciales (el que mande el navegador no vale) y quita la contraseña del body.
const httpCodes = require('../utils/httpCodes');
const { verificarCredenciales } = require('../utils/credenciales');

async function identificarEmpleado(req, res, next) {
    try {
        const { ci, contrasenia, empleado_id: empleadoElegido } = req.body;
        delete req.body.contrasenia;

        if (!ci || !contrasenia) {
            return res.status(httpCodes.BAD_REQUEST.code).json({
                message: 'El empleado tiene que escribir su CI y su contraseña para registrar la llegada.'
            });
        }

        const empleado = await verificarCredenciales(ci, contrasenia);
        // 403 y no 401: la sesión de quien presta la pantalla sigue siendo válida (#26)
        if (!empleado) {
            return res
                .status(httpCodes.FORBIDDEN.code)
                .json({ message: 'CI o contraseña del empleado incorrectos, o el empleado está inactivo.' });
        }

        // La pantalla eligió una fila (un empleado) y escribió las credenciales de otro
        if (empleadoElegido != null && empleadoElegido !== '' && Number(empleadoElegido) !== empleado.id) {
            return res.status(httpCodes.BAD_REQUEST.code).json({
                message: `Las credenciales son de ${empleado.nombre}, no del empleado elegido.`
            });
        }

        req.body.empleado_id = empleado.id;
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = { identificarEmpleado };
