const { Asistencia, Empleado, Horario } = require('../models');
const httpCodes = require('../utils/httpCodes');
const { tienePermiso } = require('../config/permisos');
const { verificarCredenciales } = require('../utils/credenciales');
const { Op } = require('sequelize');
const { fechaLocal, inicioDelDia, finDelDia } = require('../utils/fechas');

async function registrarAsistencia(req, res, next) {
    try {
        const { empleado_id, horario_id, estado, descuento_id } = req.body;

        if (!empleado_id || !estado) {
            return res.status(httpCodes.BAD_REQUEST.code).json({
                message: 'Faltan parámetros obligatorios (empleado_id, estado).'
            });
        }

        // Una llegada sin horario se rechaza (decisión de Marcelo, #28): sin la hora de entrada
        // no se puede calcular el atraso (RN-01, #29). Antes llegaba null y la base respondía 500.
        if (!horario_id) {
            return res.status(httpCodes.BAD_REQUEST.code).json({
                message: 'El empleado no tiene un horario para hoy: no se puede registrar la llegada.'
            });
        }
        const horario = await Horario.findOne({ where: { id: horario_id, empleado_id } });
        if (!horario) {
            return res.status(httpCodes.BAD_REQUEST.code).json({
                message: 'El horario indicado no existe o no es de ese empleado.'
            });
        }

        const nuevaAsistencia = await Asistencia.create({
            empleado_id,
            horario_id,
            estado,
            descuento_id: descuento_id || null,
            aprobado: false
        });

        res.status(httpCodes.CREATED.code).json({
            message: 'Asistencia grabada con éxito.',
            data: nuevaAsistencia
        });
    } catch (error) {
        next(error);
    }
}

async function listarHoy(req, res, next) {
    try {
        // "Hoy" en Bolivia, aunque el servidor esté en UTC (#27)
        const hoy = fechaLocal();
        const hoyInicio = inicioDelDia(hoy);
        const hoyFin = finDelDia(hoy);

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
            return res
                .status(httpCodes.BAD_REQUEST.code)
                .json({ message: 'CI y contraseña del supervisor son requeridos.' });
        }

        // 1. Validar la firma del supervisor
        const supervisor = await firmaDeSupervisor(ci, contrasenia);
        if (!supervisor) return firmaRechazada(res);

        // 2. Aprobar asistencia
        const asistencia = await Asistencia.findByPk(id);
        if (!asistencia) {
            return res.status(httpCodes.NOT_FOUND.code).json({ message: 'Asistencia no encontrada.' });
        }

        asistencia.aprobado = true;
        await asistencia.save();

        res.status(httpCodes.OK.code).json({ message: 'Asistencia aprobada correctamente.' });
    } catch (error) {
        next(error);
    }
}

// Firma de quien aprueba o anula: un empleado activo con el permiso asistencia.aprobar (ADMIN y
// CAJERO hoy, ADR-008). Devuelve el empleado o null.
async function firmaDeSupervisor(ci, contrasenia) {
    const supervisor = await verificarCredenciales(ci, contrasenia);
    return supervisor && tienePermiso(supervisor.rol, 'asistencia.aprobar') ? supervisor : null;
}

// La firma que no sirve responde 403, no 401: quien hace la petición sí tiene sesión (su token
// es válido) y el frontend vuelve al login ante cualquier 401 (#26).
function firmaRechazada(res) {
    return res
        .status(httpCodes.FORBIDDEN.code)
        .json({ message: 'Credenciales inválidas o sin privilegios de aprobación.' });
}

// Anular una asistencia (RN-09, #30). No se borra: queda marcada con el borrado lógico
// (deletedAt) y con quién la anuló. Así se conserva el historial, el empleado vuelve a la lista de
// turnos y puede registrar otra vez su llegada (el índice único solo cuenta las no anuladas).
// Una asistencia ya APROBADA solo se anula con la firma de quien tiene asistencia.aprobar: si
// no, la doble verificación no serviría de nada (A4).
async function eliminarAsistencia(req, res, next) {
    try {
        const { id } = req.params;
        const { ci, contrasenia } = req.body || {};

        const asistencia = await Asistencia.findByPk(id);
        if (!asistencia) {
            return res.status(httpCodes.NOT_FOUND.code).json({ message: 'Asistencia no encontrada.' });
        }

        let anuladaPor = req.empleado.id;
        if (asistencia.aprobado) {
            if (!ci || !contrasenia) {
                return res.status(httpCodes.BAD_REQUEST.code).json({
                    message: 'La asistencia ya está aprobada: para anularla hace falta la firma de un supervisor.'
                });
            }
            const supervisor = await firmaDeSupervisor(ci, contrasenia);
            if (!supervisor) return firmaRechazada(res);
            anuladaPor = supervisor.id;
        }

        await Asistencia.sequelize.transaction(async (transaction) => {
            await asistencia.update({ anulada_por: anuladaPor }, { transaction });
            await asistencia.destroy({ transaction });
        });

        res.status(httpCodes.OK.code).json({ message: 'Asistencia anulada, empleado regresado a turnos.' });
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
