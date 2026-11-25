const { Orden, ContenedorProducto, ContenedorJuego, Descuento } = require('../models');

function errorConEstado(status, mensaje) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

// Bloquea la fila de la orden (SELECT … FOR UPDATE) hasta que termine la transacción. Toda
// operación que cambia una orden o sus ítems (agregar, cambiar o borrar ítems, descuentos,
// comandas, cobro) lo llama ANTES de leer nada más: así esas operaciones sobre la misma orden
// quedan en fila, una detrás de otra, y cada una ve lo que confirmó la anterior. Sin el bloqueo,
// con READ COMMITTED, dos pedidos simultáneos leían la misma cantidad o calculaban el total sin
// las líneas del otro, y se perdían unidades y cobros (#124). Mismo patrón que la mesa en #45.
//
// Orden de los bloqueos: siempre primero la orden y después sus ítems. Con un orden fijo, dos
// operaciones no pueden quedar esperándose una a la otra (deadlock).
//
// Si `abierta` es true, una orden ya cobrada responde 409. Las demás consultas de la operación
// tienen que usar la misma transacción: si pidieran otra conexión al pool mientras esperan el
// bloqueo, con varios pedidos en fila el pool se agota (lección de #45).
async function bloquearOrden(ordenId, transaction, { abierta = true } = {}) {
    const orden = await Orden.findByPk(ordenId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!orden) throw errorConEstado(404, 'La orden no existe.');
    if (abierta && orden.finalizado) throw errorConEstado(409, 'La orden ya está cobrada y no se puede modificar.');
    return orden;
}

// Recalcula el total con el precio guardado en cada ítem (precio_unitario), no con el precio
// actual del catálogo: así borrar un producto o cambiarle el precio no cambia lo que se cobra
// en una orden ya abierta (#22, ADR-007).
// Se llama siempre después de bloquearOrden, dentro de la misma transacción.
async function actualizarTotalOrden(ordenId, transaction) {
    const orden = await Orden.findByPk(ordenId, {
        include: [{ model: ContenedorProducto }, { model: ContenedorJuego }, { model: Descuento }],
        transaction
    });

    if (!orden) return 0;

    const sumarItems = (items) =>
        (items || []).reduce((sum, item) => sum + parseFloat(item.precio_unitario) * (item.cantidad || 0), 0);

    const subtotal = sumarItems(orden.ContenedorProductos) + sumarItems(orden.ContenedorJuegos);

    let totalDescuento = 0;
    const descuentos = orden.Descuentos || [];

    for (const d of descuentos) {
        const monto = parseFloat(d.monto || 0);
        const porcentaje = parseFloat(d.porcentaje || 0);

        if (monto > 0) {
            totalDescuento += monto;
        } else if (porcentaje > 0) {
            totalDescuento += (subtotal * porcentaje) / 100;
        }
    }

    let finalTotal = subtotal - totalDescuento;
    if (finalTotal < 0) finalTotal = 0;

    await orden.update({ total: finalTotal }, { transaction });

    return finalTotal;
}

module.exports = {
    errorConEstado,
    bloquearOrden,
    actualizarTotalOrden
};
