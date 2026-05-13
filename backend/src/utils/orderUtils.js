const { 
    Orden, 
    ContenedorProducto, 
    ContenedorJuego, 
    Producto, 
    Juego, 
    Descuento 
} = require('../models');

async function actualizarTotalOrden(ordenId, transaction) {
    const orden = await Orden.findByPk(ordenId, {
        include: [
            { model: ContenedorProducto, include: [Producto] },
            { model: ContenedorJuego, include: [Juego] },
            { model: Descuento }
        ],
        transaction
    });

    if (!orden) return 0;

    let subtotal = (orden.ContenedorProductos || []).reduce((sum, item) => {
        const precio = item.Producto ? parseFloat(item.Producto.precio) : 0;
        return sum + (precio * (item.cantidad || 0));
    }, 0);

    subtotal += (orden.ContenedorJuegos || []).reduce((sum, item) => {
        const precio = item.Juego ? parseFloat(item.Juego.precio) : 0;
        return sum + (precio * (item.cantidad || 0));
    }, 0);

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