const {
    Orden,
    Mesa,
    Piso,
    Descuento,
    OrdenDescuento,
    ContenedorTransaccion,
    sequelize,
    Configuracion,
    Reserva
} = require('../models');

const { bloquearOrden, actualizarTotalOrden, errorConEstado } = require('../utils/orderUtils');
const { Op } = require('sequelize');

// Abre una orden en una mesa libre o reservada. La fila de la mesa se lee con bloqueo
// (SELECT … FOR UPDATE): si llegan dos pedidos a la vez para la misma mesa (doble clic,
// dos meseros), el segundo espera a que el primero termine y después ve la mesa ocupada.
// Sin el bloqueo, con READ COMMITTED los dos leían la mesa libre y abrían dos órdenes (#45).
// eslint-disable-next-line no-unused-vars -- usuarioId se guardará en la orden con #46 (RF-13)
async function crearOrden(mesaId, usuarioId) {
    return await sequelize.transaction(async (t) => {
        const mesa = await Mesa.findByPk(mesaId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!mesa) throw errorConEstado(404, 'La mesa no existe.');
        if (!mesa.activo) throw errorConEstado(409, 'La mesa está desactivada.');

        const piso = await Piso.findByPk(mesa.piso_id, { transaction: t });
        if (!piso || !piso.activo) throw errorConEstado(409, 'El piso de la mesa está desactivado.');

        // `estado` es un resumen; lo que no se puede repetir es una orden abierta en la mesa
        const abiertas = await Orden.count({ where: { mesa_id: mesa.id, finalizado: false }, transaction: t });
        if (mesa.estado === 1 || abiertas > 0) {
            throw errorConEstado(409, 'La mesa ya está ocupada y con orden abierta.');
        }

        const nuevaOrden = await Orden.create(
            {
                mesa_id: mesa.id,
                total: 0,
                finalizado: false
            },
            { transaction: t }
        );

        await mesa.update({ estado: 1 }, { transaction: t });

        await registrarLlegadaAutomatica(mesa.id, t);

        return nuevaOrden;
    });
}

async function listarOrdenes(filtros = {}) {
    const whereClause = {};

    if (filtros.finalizado !== undefined) {
        whereClause.finalizado = filtros.finalizado === 'true';
    } else {
        whereClause.finalizado = false;
    }

    if (filtros.mesa_id) {
        whereClause.mesa_id = filtros.mesa_id;
    }

    return await Orden.findAll({
        where: whereClause,
        include: [
            {
                model: Mesa,
                attributes: ['id', 'nombre', 'numero', 'piso_id']
            }
        ],
        order: [['createdAt', 'DESC']]
    });
}

async function obtenerOrdenPorId(id) {
    return await Orden.findByPk(id, {
        include: [{ model: Mesa }]
    });
}

/**
 * @param {Number} id
 * @param {Array} pagos
 */

const TIPOS_DE_PAGO = ['EFECTIVO', 'QR'];

// Error causado por los datos que mandó el cliente: el errorHandler lo responde como 400.
function errorDeSolicitud(mensaje) {
    const error = new Error(mensaje);
    error.status = 400;
    return error;
}

// Valida la lista de pagos que manda la caja y la normaliza (tipo en mayúsculas, monto numérico).
function normalizarPagos(pagos) {
    if (pagos === undefined || pagos === null) return [];
    if (!Array.isArray(pagos)) throw errorDeSolicitud('"pagos" tiene que ser una lista.');

    return pagos.map((pago) => {
        const tipo = String(pago?.tipo ?? '').toUpperCase();
        const monto = Number(pago?.monto);
        if (!TIPOS_DE_PAGO.includes(tipo)) {
            throw errorDeSolicitud(`Tipo de pago inválido: "${pago?.tipo ?? ''}". Use ${TIPOS_DE_PAGO.join(' o ')}.`);
        }
        if (!Number.isFinite(monto) || monto <= 0) {
            throw errorDeSolicitud('Cada pago tiene que tener un monto mayor a 0.');
        }
        return { tipo, monto };
    });
}

async function finalizarOrden(id, pagos) {
    const pagosValidos = normalizarPagos(pagos);

    return await sequelize.transaction(async (t) => {
        // Con la orden bloqueada, nadie agrega ítems entre que se lee el total y se cierra la
        // orden: antes podía quedar cerrada con ítems que no se cobraron (#124).
        const orden = await bloquearOrden(id, t);

        const totalOrden = parseFloat(orden.total);

        // Antes se inventaba un pago EFECTIVO por el total cuando no llegaban pagos (#21).
        // Una orden con total 0 (descuento del 100 %) se cierra sin registrar pagos.
        if (pagosValidos.length === 0 && totalOrden > 0) {
            throw errorDeSolicitud('Falta el detalle de los pagos (QR y/o EFECTIVO).');
        }

        const sumaPagos = pagosValidos.reduce((acc, pago) => acc + pago.monto, 0);

        if (Math.abs(sumaPagos - totalOrden) > 0.01) {
            throw errorDeSolicitud(
                `El total de los pagos (${sumaPagos}) no coincide con el total de la orden (${totalOrden})`
            );
        }

        for (const pago of pagosValidos) {
            await ContenedorTransaccion.create(
                {
                    fecha: new Date(),
                    cantidad: pago.monto,
                    tipo: pago.tipo,
                    orden_id: id,
                    activo: true
                },
                { transaction: t }
            );
        }

        await orden.update({ finalizado: true }, { transaction: t });

        await Mesa.update({ estado: 0 }, { where: { id: orden.mesa_id }, transaction: t });

        return { orden, transacciones: pagosValidos.length };
    });
}

async function eliminarOrden(id) {
    return await sequelize.transaction(async (t) => {
        const orden = await Orden.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!orden) return null;

        if (!orden.finalizado) {
            await Mesa.update({ estado: 0 }, { where: { id: orden.mesa_id }, transaction: t });
        }

        await orden.destroy({ transaction: t });
        return true;
    });
}

async function aplicarDescuento(ordenId, datos) {
    return await sequelize.transaction(async (t) => {
        // El descuento por porcentaje se calcula sobre el subtotal: con la orden bloqueada, incluye
        // los ítems que se agregaron justo antes (#124)
        await bloquearOrden(ordenId, t);

        const nuevoDescuento = await Descuento.create(
            {
                porcentaje: datos.porcentaje || 0,
                monto: datos.monto || 0,
                comentario: datos.comentario || ''
            },
            { transaction: t }
        );

        await OrdenDescuento.create(
            {
                orden_id: ordenId,
                descuento_id: nuevoDescuento.id
            },
            { transaction: t }
        );

        await actualizarTotalOrden(ordenId, t);

        return nuevoDescuento;
    });
}

async function obtenerDescuentosPorOrden(ordenId) {
    const orden = await Orden.findByPk(ordenId, {
        include: [{ model: Descuento }]
    });
    return orden ? orden.Descuentos : [];
}

async function removerDescuento(ordenId, descuentoId) {
    return await sequelize.transaction(async (t) => {
        await bloquearOrden(ordenId, t);

        await OrdenDescuento.destroy({
            where: { orden_id: ordenId, descuento_id: descuentoId },
            transaction: t
        });
        await Descuento.destroy({
            where: { id: descuentoId },
            transaction: t
        });

        await actualizarTotalOrden(ordenId, t);

        return true;
    });
}

// Todas las consultas usan la transacción de crearOrden: si una pidiera otra conexión al pool
// mientras la mesa está bloqueada, con varios pedidos esperando el bloqueo el pool se agota
// y la transacción que tiene el bloqueo no termina nunca (#45).
async function registrarLlegadaAutomatica(mesaId, transaction) {
    const [configLlegada, configTolerancia] = await Promise.all([
        Configuracion.findOne({ where: { clave: 'ventana_llegada' }, transaction }),
        Configuracion.findOne({ where: { clave: 'minutos_tolerancia' }, transaction })
    ]);

    const ventanaAnticipacionMins = configLlegada ? configLlegada.valor : 30;
    const toleranciaRetrasoMins = configTolerancia ? configTolerancia.valor : 20;

    const ahora = new Date();

    const reserva = await Reserva.findOne({
        where: {
            mesa_id: mesaId,
            estado: 'PENDIENTE',
            hora: {
                [Op.between]: [
                    new Date(ahora.getTime() - toleranciaRetrasoMins * 60 * 1000),
                    new Date(ahora.getTime() + ventanaAnticipacionMins * 60 * 1000)
                ]
            }
        },
        transaction
    });

    if (reserva) {
        await reserva.update({ estado: 'LLEGO' }, { transaction });
        console.log(`[Sistema] Reserva ${reserva.id} detectada. Estado: LLEGÓ.`);
    }
}

async function actualizarNotasDeOrden(ordenId, nuevasNotas) {
    const { Orden } = require('../models');

    const orden = await Orden.findByPk(ordenId);
    if (!orden) return null;

    orden.notas = nuevasNotas;
    await orden.save();

    return orden;
}

// Mueve una orden abierta a otra mesa (#38, RF-55, RN-15): todo lo que cuelga de la orden (ítems,
// juegos, descuentos y pagos parciales) va con ella, porque se guarda por orden_id. La mesa de
// origen queda libre y la de destino ocupada.
//
// Bloqueos, siempre en el mismo orden para que dos operaciones no se esperen una a la otra
// (deadlock):
// 1. La orden (bloquearOrden, #124). El cobro y el borrado ya bloquean orden → mesa; si mover
//    bloqueara mesa → orden, se podría trabar con un cobro de la misma orden.
// 2. Las dos mesas, de menor a mayor id. Con dos movimientos cruzados a la vez (la orden de la
//    mesa 3 a la 7 y la de la 7 a la 3), los dos piden primero la 3: el segundo espera y después
//    ve el destino ocupado (409). Si cada uno bloqueara primero "su" mesa, los dos quedarían
//    esperando la del otro y PostgreSQL cortaría uno con un error de deadlock (500).
// Todas las consultas usan la transacción (lección de #45: si no, el pool se agota).
async function moverOrden(ordenId, mesaDestinoId) {
    const destinoId = Number(mesaDestinoId);
    if (!Number.isInteger(destinoId) || destinoId <= 0) {
        throw errorConEstado(400, 'Indique la mesa de destino (mesa_id).');
    }

    return await sequelize.transaction(async (t) => {
        const orden = await bloquearOrden(ordenId, t);
        if (orden.mesa_id === destinoId) throw errorConEstado(400, 'La orden ya está en esa mesa.');

        const mesas = {};
        for (const id of [orden.mesa_id, destinoId].filter((id) => id != null).sort((a, b) => a - b)) {
            mesas[id] = await Mesa.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE, paranoid: false });
        }
        const destino = mesas[destinoId];
        if (!destino || destino.deletedAt) throw errorConEstado(404, 'La mesa de destino no existe.');
        if (!destino.activo) throw errorConEstado(409, 'La mesa de destino está desactivada.');
        const piso = await Piso.findByPk(destino.piso_id, { transaction: t });
        if (!piso || !piso.activo) throw errorConEstado(409, 'El piso de la mesa de destino está desactivado.');

        const abiertas = await Orden.count({ where: { mesa_id: destinoId, finalizado: false }, transaction: t });
        if (destino.estado === 1 || abiertas > 0) throw errorConEstado(409, 'La mesa de destino está ocupada.');

        const reserva = await reservaProxima(destinoId, t);
        if (reserva) {
            const hora = new Date(reserva.hora).toLocaleTimeString('es-BO', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            throw errorConEstado(409, `La mesa de destino tiene una reserva a las ${hora}.`);
        }

        // ⚠ Quién movió la orden no queda registrado: no hay bitácora todavía (#46, #66)
        const origen = mesas[orden.mesa_id];
        await orden.update({ mesa_id: destinoId }, { transaction: t });
        await destino.update({ estado: 1 }, { transaction: t });
        if (origen) await origen.update({ estado: 0 }, { transaction: t });

        return orden;
    });
}

// Reserva PENDIENTE de la mesa que todavía puede llegar (RN-15 con la ventana de RN-12): desde las
// que se atrasan sin pasar la tolerancia (minutos_tolerancia) hasta las que empiezan dentro de
// ventana_bloqueo, la misma ventana con la que el sistema separa dos reservas (un grupo se queda
// entre 1 y 2 horas). Decisión de Marcelo (sesión 6.1); RN-12 sigue como valor de prueba.
async function reservaProxima(mesaId, transaction) {
    const [configBloqueo, configTolerancia] = await Promise.all([
        Configuracion.findOne({ where: { clave: 'ventana_bloqueo' }, transaction }),
        Configuracion.findOne({ where: { clave: 'minutos_tolerancia' }, transaction })
    ]);
    const ventana = configBloqueo ? configBloqueo.valor : 120;
    const tolerancia = configTolerancia ? configTolerancia.valor : 20;
    const ahora = Date.now();

    return Reserva.findOne({
        where: {
            mesa_id: mesaId,
            estado: 'PENDIENTE',
            hora: { [Op.between]: [new Date(ahora - tolerancia * 60000), new Date(ahora + ventana * 60000)] }
        },
        order: [['hora', 'ASC']],
        transaction
    });
}

module.exports = {
    crearOrden,
    listarOrdenes,
    obtenerOrdenPorId,
    finalizarOrden,
    eliminarOrden,
    aplicarDescuento,
    obtenerDescuentosPorOrden,
    removerDescuento,
    registrarLlegadaAutomatica,
    actualizarNotasDeOrden,
    moverOrden
};
