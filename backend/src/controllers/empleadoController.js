const { Empleado, Horario } = require('../models');
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
            include: [{ model: Horario }], // <--- AGREGA ESTO para que viajen sus horarios asignados
            order: [['nombre', 'ASC']]
        });

        res.status(httpCodes.OK.code).json(empleados);
    } catch (error) {
        next(error);
    }
}

async function actualizarEmpleado(req, res, next) {
    try {
        const { id } = req.params;
        const { nombre, ci, telefono, correo, contrasenia, rol, activo, horarios } = req.body;

        // 1. Buscar si el empleado existe
        const empleado = await Empleado.findByPk(id);
        if (!empleado) {
            return res.status(httpCodes.NOT_FOUND.code).json({
                message: "Empleado no encontrado."
            });
        }

        // 2. CORRECCIÓN: Actualizar los datos básicos SOLO si vienen en el body
        if (nombre !== undefined) empleado.nombre = nombre;
        if (ci !== undefined) empleado.ci = ci;
        if (telefono !== undefined) empleado.telefono = telefono;
        if (correo !== undefined) empleado.correo = correo || null;
        if (rol !== undefined) empleado.rol = rol;
        if (activo !== undefined) empleado.activo = activo;

        // Si se envió una nueva contraseña y no está vacía
        if (contrasenia && contrasenia.trim() !== "") {
            empleado.contrasenia = contrasenia;
        }

        await empleado.save();

        // 3. Actualizar la agenda de horarios (Si se enviaron en la petición)
        if (horarios && Array.isArray(horarios)) {
            // Eliminamos la planificación de días anterior para evitar duplicados
            await Horario.destroy({ where: { empleado_id: id } });

            // Insertamos las nuevas asignaciones
            if (horarios.length > 0) {
                const nuevosHorarios = horarios.map(h => ({
                    dia: h.dia,
                    hora_entrada: h.hora_entrada,
                    empleado_id: id
                }));
                await Horario.bulkCreate(nuevosHorarios);
            }
        }

        res.status(httpCodes.OK.code).json({
            message: "Empleado actualizado exitosamente."
        });

    } catch (error) {
        console.error("ERROR DETALLADO EN ACTUALIZAR EMPLEADO:", error);
        next(error);
    }
}

module.exports = {
    crearEmpleado,
    obtenerPerfil,
    listar,
    actualizarEmpleado
};