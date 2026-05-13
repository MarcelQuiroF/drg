const { Empleado } = require('../models');
const httpCodes = require('../utils/httpCodes');


async function crearEmpleado(req, res, next) {
    try {
        const { nombre, ci, telefono, correo, contrasenia, rol, direccion } = req.body;

        if (!nombre || !ci || !contrasenia || !rol) {
            return res.status(httpCodes.BAD_REQUEST.code).json({
                message: "Faltan datos obligatorios (nombre, ci, contraseña, rol)."
            });
        }

        const nuevoEmpleado = await Empleado.create({
            nombre,
            ci,
            telefono,
            correo,
            contrasenia,
            rol,
            direccion,
            activo: true
        });

        const empleadoResponse = nuevoEmpleado.toJSON();
        delete empleadoResponse.contrasenia;
        delete empleadoResponse.deletedAt;

        res.status(httpCodes.CREATED.code).json({
            message: "Empleado creado exitosamente.",
            data: empleadoResponse
        });

    } catch (error) {
        next(error);
    }
}

async function obtenerPerfil(req, res, next) {
    try {
        if (!req.empleado) {
             return res.status(httpCodes.UNAUTHORIZED.code).json({ message: "No autorizado" });
        }
        res.status(httpCodes.OK.code).json({
            message: "Perfil obtenido",
            empleado: req.empleado
        });
    } catch (error) {
        next(error);
    }
}

async function listar(req, res, next) {
    try {
        const empleados = await Empleado.findAll({
            attributes: { exclude: ['contrasenia'] },
            order: [['nombre', 'ASC']]
        });

        res.status(httpCodes.OK.code).json(empleados);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    crearEmpleado,
    obtenerPerfil,
    listar
};