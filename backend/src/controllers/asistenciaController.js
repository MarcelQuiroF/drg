const { Asistencia, Empleado, Horario, DescuentoAtraso } = require('../models');
const httpCodes = require('../utils/httpCodes');
const { tienePermiso } = require('../config/permisos');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { fechaLocal, inicioDelDia, finDelDia } = require('../utils/fechas');
const { esDelDia, segundosDeAtraso, descuentoQueCorresponde } = require('../utils/atraso');
const reloj = require('../utils/reloj');

async function registrarAsistencia(req, res, next) {
    try {
        // descuento_id ya no se lee del body: el descuento lo calcula el servidor (RN-01, A6, #29)
        const { empleado_id, horario_id, estado } = req.body;

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

        // La hora de llegada es la del servidor, no la del navegador
        const llegada = reloj.ahora();
        if (!esDelDia(horario, llegada)) {
            return res.status(httpCodes.BAD_REQUEST.code).json({
                message: `El horario indicado es del ${horario.dia}, no de hoy.`
            });
        }

        // RN-01: el atraso se mide contra la hora de entrada del horario de hoy y el descuento sale
        // de la tabla descuento_atraso. Solo se calcula para PRESENTE: FALTA y PERMISO no son una
        // llegada tarde (⚠ confirmar con el dueño el 10/12, P-07).
        const segundos = estado === 'PRESENTE' ? segundosDeAtraso(llegada, horario.hora_entrada) : 0;
        const tabla = await DescuentoAtraso.findAll({ attributes: ['id', 'cantidad_tiempo', 'descuento_porcentual'] });
        const descuento = descuentoQueCorresponde(segundos, tabla);

        const nuevaAsistencia = await Asistencia.create({
            empleado_id,
            horario_id,
            estado,
            fecha_hora_llegada: llegada,
            descuento_id: descuento ? descuento.id : null,
            aprobado: false
        });

        res.status(httpCodes.CREATED.code).json({
            message: 'Asistencia grabada con éxito.',
            data: nuevaAsistencia,
            // Lo que calculó el servidor, para que el frontend lo muestre sin calcular nada
            atraso: {
                minutos: Math.floor(segundos / 60),
                segundos,
                descuento_porcentual: descuento ? descuento.descuento_porcentual : 0
            }
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
                { model: Horario, attributes: ['hora_entrada'] },
                // El descuento que calculó el servidor al registrar la llegada (#29)
                { model: DescuentoAtraso, attributes: ['id', 'cantidad_tiempo', 'descuento_porcentual'] }
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

        // 1. Buscar al supervisor y validar credenciales
        const supervisor = await Empleado.findOne({ where: { ci, activo: true } });
        // La firma del supervisor que no sirve responde 403, no 401: quien hace la petición sí tiene
        // sesión (su token es válido) y el frontend vuelve al login ante cualquier 401 (#26).
        // Quien firma tiene que tener el permiso de aprobar (ADMIN y CAJERO hoy, ADR-008)
        if (!supervisor || !tienePermiso(supervisor.rol, 'asistencia.aprobar')) {
            return res
                .status(httpCodes.FORBIDDEN.code)
                .json({ message: 'Credenciales inválidas o sin privilegios de aprobación.' });
        }

        const validPassword = await bcrypt.compare(contrasenia, supervisor.contrasenia);
        if (!validPassword) {
            return res.status(httpCodes.FORBIDDEN.code).json({ message: 'Contraseña incorrecta.' });
        }

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

async function eliminarAsistencia(req, res, next) {
    try {
        const { id } = req.params;
        // Usamos force: true para borrado físico y que el empleado vuelva a aparecer limpio en los turnos
        await Asistencia.destroy({ where: { id }, force: true });

        res.status(httpCodes.OK.code).json({ message: 'Registro eliminado, empleado regresado a turnos.' });
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
