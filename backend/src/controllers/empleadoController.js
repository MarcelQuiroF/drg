const empleadoService = require('../services/empleadoService');
const httpCodes = require('../utils/httpCodes');

async function crearEmpleado(req, res, next) {
    try {
        const empleado = await empleadoService.crearEmpleado(req.body);
        res.status(httpCodes.CREATED.code).json({
            message: 'Empleado creado exitosamente.',
            data: empleado
        });
    } catch (error) {
        next(error);
    }
}

async function obtenerPerfil(req, res, next) {
    try {
        if (!req.empleado) {
            return res.status(httpCodes.UNAUTHORIZED.code).json({ message: 'No autorizado' });
        }
        res.status(httpCodes.OK.code).json({
            message: 'Perfil obtenido',
            empleado: req.empleado
        });
    } catch (error) {
        next(error);
    }
}

async function listar(req, res, next) {
    try {
        const empleados = await empleadoService.listar();
        res.status(httpCodes.OK.code).json(empleados);
    } catch (error) {
        next(error);
    }
}

async function actualizarEmpleado(req, res, next) {
    try {
        const empleado = await empleadoService.actualizarEmpleado(req.params.id, req.body);
        if (!empleado) {
            return res.status(httpCodes.NOT_FOUND.code).json({
                message: 'Empleado no encontrado.'
            });
        }

        res.status(httpCodes.OK.code).json({
            message: 'Empleado actualizado exitosamente.'
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    crearEmpleado,
    obtenerPerfil,
    listar,
    actualizarEmpleado
};
