const { Asistencia, Empleado, Horario } = require('../models');
const httpCodes = require('../utils/httpCodes');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

async function registrarAsistencia(req, res, next) {
    try {
        const { empleado_id, horario_id, estado, descuento_id } = req.body;

        if (!empleado_id || !estado) {
            return res.status(httpCodes.BAD_REQUEST.code).json({
                message: "Faltan parámetros obligatorios (empleado_id, estado)."
            });
        }

        const nuevaAsistencia = await Asistencia.create({
            empleado_id,
            horario_id: horario_id || null,
            estado,
            descuento_id: descuento_id || null,
            aprobado: false 
        });

        res.status(httpCodes.CREATED.code).json({
            message: "Asistencia grabada con éxito.",
            data: nuevaAsistencia
        });
    } catch (error) {
        next(error);
    }
}

async function listarHoy(req, res, next) {
    try {
        const hoyInicio = new Date();
        hoyInicio.setHours(0, 0, 0, 0);
        const hoyFin = new Date();
        hoyFin.setHours(23, 59, 59, 999);

        const asistencias = await Asistencia.findAll({
            where: {
                fecha_hora_llegada: {
                    [Op.between]: [hoyInicio, hoyFin]
                }
            },
            include: [
                { model: Empleado, attributes: ['id', 'nombre', 'rol', 'ci'] },
                { model: Horario, attributes: ['hora_entrada'] }
            ],
            order: [['fecha_hora_llegada', 'DESC']]
        });

        res.status(httpCodes.OK.code).json(asistencias);
    } catch (error) {
        next(error);
    }
}

async function aprobarAsistencia(req, res, next) {
    try {
        const { id } = req.params;
        const { ci, contrasenia } = req.body;

        if (!ci || !contrasenia) {
            return res.status(httpCodes.BAD_REQUEST.code).json({ message: "CI y contraseña del supervisor son requeridos." });
        }

        // 1. Buscar al supervisor y validar credenciales
        const supervisor = await Empleado.findOne({ where: { ci, activo: true } });
        if (!supervisor || (supervisor.rol !== 'ADMIN' && supervisor.rol !== 'CAJERO')) {
            return res.status(httpCodes.UNAUTHORIZED.code).json({ message: "Credenciales inválidas o sin privilegios de aprobación." });
        }

        const validPassword = await bcrypt.compare(contrasenia, supervisor.contrasenia);
        if (!validPassword) {
            return res.status(httpCodes.UNAUTHORIZED.code).json({ message: "Contraseña incorrecta." });
        }

        // 2. Aprobar asistencia
        const asistencia = await Asistencia.findByPk(id);
        if (!asistencia) {
            return res.status(httpCodes.NOT_FOUND.code).json({ message: "Asistencia no encontrada." });
        }

        asistencia.aprobado = true;
        await asistencia.save();

        res.status(httpCodes.OK.code).json({ message: "Asistencia aprobada correctamente." });
    } catch (error) {
        next(error);
    }
}

async function eliminarAsistencia(req, res, next) {
    try {
        const { id } = req.params;
        // Usamos force: true para borrado físico y que el empleado vuelva a aparecer limpio en los turnos
        await Asistencia.destroy({ where: { id }, force: true });
        
        res.status(httpCodes.OK.code).json({ message: "Registro eliminado, empleado regresado a turnos." });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    registrarAsistencia,
    listarHoy,
    aprobarAsistencia,
    eliminarAsistencia
};