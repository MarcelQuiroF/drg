const { Orden, ContenedorProducto, ContenedorJuego, Descuento } = require('../models');

// Recalcula el total con el precio guardado en cada ítem (precio_unitario), no con el precio
// actual del catálogo: así borrar un producto o cambiarle el precio no cambia lo que se cobra
// en una orden ya abierta (#22, ADR-007).
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
    actualizarTotalOrden
};
