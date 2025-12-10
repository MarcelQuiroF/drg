const { ContenedorProducto, Producto, Orden, Mesa, sequelize } = require('../models');
const { Op } = require('sequelize');


async function listarPendientes(zona) {
    const whereProducto = {};
    if (zona) {
        whereProducto.zona = zona;
    }
    return await ContenedorProducto.findAll({
        where: {
            cantidad_enviado: { [Op.lt]: sequelize.col('ContenedorProducto.cantidad') }
        },
        include: [
            {
                model: Producto,
                where: whereProducto,
                attributes: ['nombre', 'zona']
            },
            {
                model: Orden,
                attributes: ['id', 'finalizado'],
                include: [{ model: Mesa, attributes: ['nombre', 'numero'] }] 
            }
        ],
        order: [['createdAt', 'ASC']] 
    });
}

async function avanzarEstado(id, cantidadAvanzar = null, estadoOrigen = null) {
    return await sequelize.transaction(async (t) => {
        const item = await ContenedorProducto.findByPk(id, { transaction: t });
        if (!item) throw new Error("Comanda no encontrada.");

        let cantidad = cantidadAvanzar ? parseInt(cantidadAvanzar) : null;
        let origen = estadoOrigen ? estadoOrigen.toUpperCase() : null;

        if (origen) {
            const mapaEstados = {
                'RECIBIDO': 'cantidad_recibido',
                'PREPARANDO': 'cantidad_preparando',
                'TERMINADO': 'cantidad_terminado'
            };

            const columnaOrigen = mapaEstados[origen];
            if (!columnaOrigen) throw new Error("Estado de origen no válido. Use: RECIBIDO, PREPARANDO o TERMINADO.");

            if (!cantidad) cantidad = item[columnaOrigen];

            if (item[columnaOrigen] < cantidad) {
                throw new Error(`No puedes mover ${cantidad} items de ${origen} porque solo hay ${item[columnaOrigen]}.`);
            }

            if (origen === 'RECIBIDO') {
                item.cantidad_recibido -= cantidad;
                item.cantidad_preparando += cantidad;
            } else if (origen === 'PREPARANDO') {
                item.cantidad_preparando -= cantidad;
                item.cantidad_terminado += cantidad;
            } else if (origen === 'TERMINADO') {
                item.cantidad_terminado -= cantidad;
                item.cantidad_enviado += cantidad;
            }
        } 
        
        else {
            const calcularMovimiento = (disponible) => {
                if (!cantidad) return disponible;
                if (cantidad > disponible) throw new Error(`Solo hay ${disponible} items en este estado.`);
                return cantidad;
            };

            let movido = 0;
            if (item.cantidad_preparando > 0) {
                movido = calcularMovimiento(item.cantidad_preparando);
                item.cantidad_preparando -= movido;
                item.cantidad_terminado += movido;
            } else if (item.cantidad_recibido > 0) {
                movido = calcularMovimiento(item.cantidad_recibido);
                item.cantidad_recibido -= movido;
                item.cantidad_preparando += movido;
            } else if (item.cantidad_terminado > 0) {
                movido = calcularMovimiento(item.cantidad_terminado);
                item.cantidad_terminado -= movido;
                item.cantidad_enviado += movido;
            } else {
                throw new Error("El item ya fue entregado completamente.");
            }
        }

        await item.save({ transaction: t });
        return item;
    });
}

module.exports = {
    listarPendientes,
    avanzarEstado
};