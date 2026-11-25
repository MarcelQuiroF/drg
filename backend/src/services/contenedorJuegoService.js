const { ContenedorJuego, Orden, Juego, sequelize } = require('../models');
const { actualizarTotalOrden } = require('../utils/orderUtils');

async function agregarJuego(datos) {
    return await sequelize.transaction(async (t) => {
        const orden = await Orden.findByPk(datos.orden_id, { transaction: t });
        if (!orden) throw new Error('La orden no existe.');
        if (orden.finalizado) throw new Error('Orden finalizada.');

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
        const item = await ContenedorJuego.findByPk(id, { transaction: t });
        if (!item) return null;

        const ordenId = item.orden_id;
        const orden = await Orden.findByPk(ordenId, { transaction: t });
        if (orden.finalizado) throw new Error('Orden cerrada.');

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
