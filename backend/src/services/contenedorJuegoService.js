const { ContenedorJuego, Juego, sequelize } = require('../models');
const { bloquearOrden, actualizarTotalOrden } = require('../utils/orderUtils');

// Igual que con los productos, cada operación bloquea primero la orden (#124).
async function agregarJuego(datos) {
    return await sequelize.transaction(async (t) => {
        await bloquearOrden(datos.orden_id, t);

        const juego = await Juego.findByPk(datos.juego_id, { transaction: t });
        if (!juego) throw new Error('El juego no existe.');

        const nuevoJuego = await ContenedorJuego.create(
            {
                orden_id: datos.orden_id,
                juego_id: datos.juego_id,
                precio_unitario: juego.precio,
                cantidad: datos.cantidad,
                comentario: datos.comentario,

                // Las dos horas del préstamo las pone PostgreSQL (LOCALTIME) en la zona de la conexión,
                // que es la de Bolivia (config.js). Antes hora_inicio salía de la zona del proceso y
                // hora_fin de un Date convertido en UTC: no estaban en la misma zona (#27)
                hora_inicio: sequelize.literal('LOCALTIME(0)')
            },
            { transaction: t }
        );

        await actualizarTotalOrden(datos.orden_id, t);

        return await ContenedorJuego.findByPk(nuevoJuego.id, {
            include: [{ model: Juego, attributes: ['nombre', 'precio'], paranoid: false }],
            transaction: t
        });
    });
}

async function listarPorOrden(ordenId) {
    return await ContenedorJuego.findAll({
        where: { orden_id: ordenId },
        // Un juego borrado del catálogo sigue apareciendo en las órdenes que lo tienen
        include: [
            { model: Juego, attributes: ['id', 'nombre', 'precio', 'imagen', 'tiempo_partida'], paranoid: false }
        ],
        order: [['hora_inicio', 'ASC']]
    });
}

async function terminarJuego(id) {
    const item = await ContenedorJuego.findByPk(id);
    if (!item) return null;

    await item.update({ hora_fin: sequelize.literal('LOCALTIME(0)') });
    return await item.reload();
}

async function eliminarJuego(id) {
    return await sequelize.transaction(async (t) => {
        const encontrado = await ContenedorJuego.findByPk(id, { transaction: t });
        if (!encontrado) return null;

        const ordenId = encontrado.orden_id;
        await bloquearOrden(ordenId, t);
        // Otra vez, ya con la orden bloqueada: pudo borrarse mientras se esperaba
        const item = await ContenedorJuego.findByPk(id, { transaction: t });
        if (!item) return null;

        await item.destroy({ transaction: t });
        await actualizarTotalOrden(ordenId, t);

        return true;
    });
}

module.exports = {
    agregarJuego,
    listarPorOrden,
    terminarJuego,
    eliminarJuego
};
