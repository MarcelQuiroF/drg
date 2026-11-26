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

// Largo de descuento.comentario en la base (varchar(255))
const LARGO_MOTIVO = 255;

// RN-06 (#39): todo descuento lleva un motivo y guarda quién lo aplicó. Sin tope ni autorización:
// el control lo hace el administrador después (GET /descuentos). Si el descuento supera lo que
// queda por pagar, la orden quedaría en 0: se avisa (409 DESCUENTO_SUPERA_TOTAL) y solo se aplica
// si el pedido vuelve con confirmar = true.
async function aplicarDescuento(ordenId, datos) {
    const motivo = String(datos.comentario ?? '').trim();
    if (!motivo) throw errorConEstado(400, 'El motivo del descuento es obligatorio (RN-06).');
    if (motivo.length > LARGO_MOTIVO) {
        throw errorConEstado(400, `El motivo no puede tener más de ${LARGO_MOTIVO} caracteres.`);
    }

    return await sequelize.transaction(async (t) => {
        // El descuento por porcentaje se calcula sobre el subtotal: con la orden bloqueada, incluye
        // los ítems que se agregaron justo antes (#124)
        const orden = await bloquearOrden(ordenId, t);

        if (!datos.confirmar) {
            const enBs = await descuentoEnBs(ordenId, datos, t);
            const porPagar = parseFloat(orden.total);
            if (enBs > porPagar + 0.005) {
                const error = errorConEstado(
                    409,
                    `El descuento (Bs ${enBs.toFixed(2)}) supera lo que queda por pagar (Bs ${porPagar.toFixed(2)}): ` +
                        'la orden quedaría en Bs 0.00. Confirme para aplicarlo igual.'
                );
                error.datos = { codigo: 'DESCUENTO_SUPERA_TOTAL', descuento_bs: enBs, por_pagar: porPagar };
                throw error;
            }
        }

        const nuevoDescuento = await Descuento.create(
            {
                porcentaje: datos.porcentaje || 0,
                monto: datos.monto || 0,
                comentario: motivo,
                empleado_id: datos.empleadoId ?? null
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

// Cuánto vale en Bs un descuento nuevo sobre esta orden: el monto, o el porcentaje del subtotal
// (precio cobrado × cantidad de productos y juegos), como en actualizarTotalOrden
async function descuentoEnBs(ordenId, { monto, porcentaje }, transaction) {
    if (parseFloat(monto) > 0) return parseFloat(monto);
    const [[{ subtotal }]] = await sequelize.query(
        `SELECT COALESCE((SELECT SUM(precio_unitario * cantidad) FROM contenedor_producto
                          WHERE orden_id = :ordenId AND "deletedAt" IS NULL), 0)
              + COALESCE((SELECT SUM(precio_unitario * cantidad) FROM contenedor_juego
                          WHERE orden_id = :ordenId AND "deletedAt" IS NULL), 0) AS subtotal`,
        { replacements: { ordenId }, transaction }
    );
    return Math.round(((parseFloat(subtotal) * parseFloat(porcentaje || 0)) / 100) * 100) / 100;
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
    actualizarNotasDeOrden
};
