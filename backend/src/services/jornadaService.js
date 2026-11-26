'use strict';

// Apertura, cierre y estado del día (#34, RF-22, RN-16).
const { Jornada, Empleado, Orden, Mesa, sequelize } = require('../models');
const { verificarCredenciales } = require('../utils/credenciales');
const { tienePermiso } = require('../config/permisos');
const { errorConEstado } = require('../utils/orderUtils');
const { fechaLocal } = require('../utils/fechas');
const { resumenDeCobros } = require('./cobrosService');
const reloj = require('../utils/reloj');

const PERMISO = 'dia.abrir_cerrar';

const conEmpleados = [
    { model: Empleado, as: 'abridor', attributes: ['id', 'nombre'] },
    { model: Empleado, as: 'cerrador', attributes: ['id', 'nombre'] }
];

// Como en la llegada (RF-43): quien tiene la sesión presta la pantalla y el que abre o cierra
// escribe su CI y su contraseña. Tiene que ser un empleado activo con el permiso.
// 403 y no 401: la sesión de quien presta la pantalla sigue siendo válida (#26).
async function identificar({ ci, contrasenia } = {}, accion) {
    if (!ci || !contrasenia) {
        throw errorConEstado(400, `Para ${accion} el día hay que escribir el CI y la contraseña.`);
    }
    const empleado = await verificarCredenciales(ci, contrasenia);
    if (!empleado) throw errorConEstado(403, 'CI o contraseña incorrectos, o el empleado está inactivo.');
    if (!tienePermiso(empleado.rol, PERMISO)) {
        throw errorConEstado(403, `${empleado.nombre} no tiene permiso para ${accion} el día (${PERMISO}).`);
    }
    return empleado;
}

const fechaCorta = (fecha) => fecha.split('-').reverse().join('/');

// La jornada abierta o, si no hay, la última cerrada (con su resumen). Sin ninguna, null.
async function actual() {
    const jornada =
        (await Jornada.findOne({ where: { cerrada_en: null }, include: conEmpleados })) ||
        (await Jornada.findOne({ order: [['abierta_en', 'DESC']], include: conEmpleados }));
    return { abierta: Boolean(jornada && !jornada.cerrada_en), jornada };
}

async function abrir(credenciales) {
    const empleado = await identificar(credenciales, 'abrir');
    const ahora = reloj.ahora();
    const fecha = fechaLocal(ahora); // día de Bolivia (#27)

    const jornada = await sequelize.transaction(async (t) => {
        // Mensajes claros para los casos comunes. Si dos aperturas llegan a la vez, las dos pasan
        // por aquí y la base rechaza la segunda por jornada_una_abierta (409 en errorHandler).
        const abierta = await Jornada.findOne({ where: { cerrada_en: null }, transaction: t });
        if (abierta) throw errorConEstado(409, `El día ${fechaCorta(abierta.fecha)} sigue abierto: ciérrelo primero.`);

        const deHoy = await Jornada.findOne({ where: { fecha }, transaction: t });
        if (deHoy) {
            throw errorConEstado(
                409,
                `El día ${fechaCorta(fecha)} ya se cerró. Para corregirlo, el administrador lo reabre.`
            );
        }

        return Jornada.create({ fecha, abierta_por: empleado.id, abierta_en: ahora }, { transaction: t });
    });
    return Jornada.findByPk(jornada.id, { include: conEmpleados });
}

async function cerrar(credenciales) {
    const empleado = await identificar(credenciales, 'cerrar');

    const jornada = await sequelize.transaction(async (t) => {
        // FOR UPDATE: espera a las operaciones que tienen el día "en uso" (FOR SHARE, utils/jornada.js)
        // y deja esperando a las que llegan. Dos cierres a la vez: el segundo, al obtener el bloqueo,
        // ya no encuentra la fila abierta.
        const abierta = await Jornada.findOne({ where: { cerrada_en: null }, transaction: t, lock: t.LOCK.UPDATE });
        if (!abierta) throw errorConEstado(409, 'No hay un día abierto para cerrar.');

        // Decisión de Marcelo (sesión 6.1, ⚠ confirmar con el dueño el 10/12): con órdenes abiertas
        // no se cierra. Hay que cobrarlas o borrarlas antes; así cada día cierra sin pendientes.
        const pendientes = await Orden.findAll({
            where: { finalizado: false },
            include: [{ model: Mesa, attributes: ['id', 'nombre', 'numero'], paranoid: false }],
            order: [['id', 'ASC']],
            transaction: t
        });
        if (pendientes.length > 0) {
            const error = errorConEstado(
                409,
                `No se puede cerrar el día: hay ${pendientes.length} orden(es) abierta(s). Cóbrelas o bórrelas antes.`
            );
            error.datos = {
                codigo: 'ORDENES_ABIERTAS',
                ordenesAbiertas: pendientes.map((o) => ({
                    id: o.id,
                    total: Number(o.total),
                    mesa: o.Mesa ? { id: o.Mesa.id, nombre: o.Mesa.nombre, numero: o.Mesa.numero } : null
                }))
            };
            throw error;
        }

        const cierre = reloj.ahora();
        // Lo cobrado entre la apertura y el cierre: una venta pasada la medianoche cuenta en su jornada
        const resumen = await resumenDeCobros(abierta.abierta_en, cierre, { transaction: t });
        await abierta.update({ cerrada_por: empleado.id, cerrada_en: cierre, resumen }, { transaction: t });
        return abierta;
    });
    return Jornada.findByPk(jornada.id, { include: conEmpleados });
}

module.exports = { actual, abrir, cerrar };
