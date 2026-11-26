'use strict';

// Sección de control de descuentos del administrador (#39, RF-49). Los descuentos no tienen tope ni
// autorización (RN-06): el control es este listado, con quién aplicó cada uno y su motivo.
const { Descuento, Orden, Mesa, Empleado, ContenedorProducto, ContenedorJuego } = require('../models');
const { Op } = require('sequelize');
const { inicioDelDia, finDelDia } = require('../utils/fechas');
const { errorConEstado } = require('../utils/orderUtils');

const redondear = (n) => Math.round(n * 100) / 100;

// Lo que de verdad descontó cada descuento, en Bs. Igual que el total (actualizarTotalOrden): un
// porcentaje se calcula sobre el subtotal, y el total nunca baja de 0. Si los descuentos suman más
// que el subtotal, cuenta solo hasta llegar a 0, en el orden en que se aplicaron. Así la suma del
// listado es lo que la orden dejó de cobrar.
async function descontadoPorDescuento(ordenIds) {
    if (ordenIds.length === 0) return {};
    const deLasOrdenes = { where: { orden_id: { [Op.in]: ordenIds } } };
    const [productos, juegos, ordenes] = await Promise.all([
        ContenedorProducto.findAll(deLasOrdenes),
        ContenedorJuego.findAll(deLasOrdenes),
        Orden.findAll({
            where: { id: { [Op.in]: ordenIds } },
            include: [{ model: Descuento, attributes: ['id', 'monto', 'porcentaje'] }]
        })
    ]);
    const subtotal = {};
    for (const item of [...productos, ...juegos]) {
        subtotal[item.orden_id] = (subtotal[item.orden_id] || 0) + parseFloat(item.precio_unitario) * item.cantidad;
    }
    const real = {};
    for (const orden of ordenes) {
        const base = subtotal[orden.id] || 0;
        let queda = base;
        for (const d of [...orden.Descuentos].sort((a, b) => a.id - b.id)) {
            const nominal =
                parseFloat(d.monto) > 0 ? parseFloat(d.monto) : (base * parseFloat(d.porcentaje || 0)) / 100;
            const aplicado = Math.min(nominal, queda);
            real[d.id] = redondear(aplicado);
            queda -= aplicado;
        }
    }
    return real;
}

function filtrosDelPedido({ desde, hasta, empleado_id: empleadoId }) {
    const where = {};
    if (desde || hasta) {
        if (!desde || !hasta) {
            throw errorConEstado(400, 'Indique las dos fechas del rango (desde y hasta), o ninguna para ver todo.');
        }
        // Días de Bolivia (#27). inicioDelDia/finDelDia validan el formato (400)
        const inicio = inicioDelDia(desde);
        const fin = finDelDia(hasta);
        if (inicio > fin) throw errorConEstado(400, 'La fecha "desde" es posterior a la fecha "hasta".');
        where.createdAt = { [Op.between]: [inicio, fin] };
    }
    if (empleadoId !== undefined && empleadoId !== '') {
        const id = Number(empleadoId);
        if (!Number.isInteger(id) || id <= 0) throw errorConEstado(400, 'empleado_id tiene que ser un número.');
        where.empleado_id = id;
    }
    return where;
}

// Descuentos vigentes (los quitados de la orden no cuentan) de órdenes que no se borraron, del más
// nuevo al más viejo, filtrables por rango de fechas y por empleado.
async function listar(filtros = {}) {
    const descuentos = await Descuento.findAll({
        where: filtrosDelPedido(filtros),
        include: [
            {
                model: Orden,
                required: true,
                attributes: ['id', 'total', 'finalizado'],
                through: { attributes: [] },
                include: [{ model: Mesa, attributes: ['id', 'nombre', 'numero'], paranoid: false }]
            },
            { model: Empleado, as: 'aplicador', attributes: ['id', 'nombre'], paranoid: false }
        ],
        order: [
            ['createdAt', 'DESC'],
            ['id', 'DESC']
        ]
    });

    const real = await descontadoPorDescuento([...new Set(descuentos.map((d) => d.Ordens[0].id))]);
    const lista = descuentos.map((d) => {
        const orden = d.Ordens[0];
        const esMonto = parseFloat(d.monto) > 0;
        return {
            id: d.id,
            fecha: d.createdAt,
            orden: { id: orden.id, cobrada: orden.finalizado, total: parseFloat(orden.total) },
            mesa: orden.Mesa ? { id: orden.Mesa.id, nombre: orden.Mesa.nombre, numero: orden.Mesa.numero } : null,
            tipo: esMonto ? 'MONTO' : 'PORCENTAJE',
            valor: esMonto ? parseFloat(d.monto) : Number(d.porcentaje),
            descontado: real[d.id] ?? 0,
            motivo: d.comentario,
            empleado: d.aplicador ? { id: d.aplicador.id, nombre: d.aplicador.nombre } : null
        };
    });

    return {
        descuentos: lista,
        totales: { cantidad: lista.length, descontado: redondear(lista.reduce((s, d) => s + d.descontado, 0)) }
    };
}

module.exports = { listar, descontadoPorDescuento };
