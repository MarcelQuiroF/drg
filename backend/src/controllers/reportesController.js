const {
    ContenedorProducto,
    ContenedorJuego,
    ContenedorTransaccion,
    Reserva,
    Producto,
    Juego,
    sequelize
} = require('../models');
const httpCodes = require('../utils/httpCodes');
const { fechaLocal, inicioDelDia, finDelDia, diasDelRango } = require('../utils/fechas');
const { Op, QueryTypes } = require('sequelize');

// Dashboard (#31). UNA sola fuente para todos los números: las órdenes COBRADAS y sus pagos.
// - Una orden cuenta el día de su cobro: la fecha de su último pago (en hora de Bolivia, #27).
//   Las órdenes abiertas no cuentan, aunque ya tengan pagos parciales.
// - Ingresos, efectivo/QR y la gráfica suman los pagos (contenedor_transaccion) de esas órdenes.
// - La cantidad de órdenes, la distribución comida/juegos y los rankings salen de las mismas
//   órdenes. La distribución reparte lo PAGADO de cada orden en proporción a lo que valían sus
//   productos y sus juegos, para que comida + juegos = ingresos aunque haya descuentos.
// - Los promedios dividen por los días reales del rango, contando los dos extremos.
// Antes, la gráfica y el total de órdenes salían de Orden.total con las órdenes abiertas, el
// promedio de "la semana" dividía por 8 y el ranking de juegos contaba filas.

// Órdenes cobradas cuyo último pago cae en el rango, con esa fecha. Sin rango, todas.
async function ordenesCobradas(fechaInicio, fechaFin) {
    const filtro = fechaInicio ? 'HAVING MAX(t.fecha) BETWEEN :fechaInicio AND :fechaFin' : '';
    return sequelize.query(
        `SELECT t.orden_id, MAX(t.fecha) AS fecha_cobro
         FROM contenedor_transaccion t
         JOIN orden o ON o.id = t.orden_id AND o.finalizado = true AND o."deletedAt" IS NULL
         WHERE t."deletedAt" IS NULL
         GROUP BY t.orden_id
         ${filtro}`,
        { type: QueryTypes.SELECT, replacements: { fechaInicio, fechaFin } }
    );
}

function rangoPedido({ inicio, fin }) {
    if (!inicio && !fin) return null;
    if (!inicio || !fin) {
        const error = new Error('Indique las dos fechas del rango (inicio y fin), o ninguna para ver todo.');
        error.status = httpCodes.BAD_REQUEST.code;
        throw error;
    }
    // inicioDelDia y finDelDia validan el formato (400). Los días son de Bolivia (#27).
    const fechaInicio = inicioDelDia(inicio);
    const fechaFin = finDelDia(fin);
    if (fechaInicio > fechaFin) {
        const error = new Error('La fecha de inicio es posterior a la fecha de fin.');
        error.status = httpCodes.BAD_REQUEST.code;
        throw error;
    }
    return { inicio, fin, fechaInicio, fechaFin };
}

const redondear = (n) => Math.round(n * 100) / 100;
const top5 = (mapa) =>
    Object.entries(mapa)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

async function obtenerDatosDashboard(req, res, next) {
    try {
        const rango = rangoPedido(req.query);

        const cobradas = await ordenesCobradas(rango?.fechaInicio, rango?.fechaFin);
        const ids = cobradas.map((c) => c.orden_id);
        const deLasCobradas = { orden_id: { [Op.in]: ids } };

        const [transacciones, productosVendidos, juegosPrestados, reservas] = await Promise.all([
            ContenedorTransaccion.findAll({ attributes: ['orden_id', 'cantidad', 'tipo'], where: deLasCobradas }),
            ContenedorProducto.findAll({
                attributes: ['orden_id', 'cantidad', 'precio_unitario'],
                include: [{ model: Producto, attributes: ['nombre'], paranoid: false }],
                where: deLasCobradas
            }),
            ContenedorJuego.findAll({
                attributes: ['orden_id', 'cantidad', 'precio_unitario'],
                include: [{ model: Juego, attributes: ['nombre'], paranoid: false }],
                where: deLasCobradas
            }),
            Reserva.count(rango ? { where: { createdAt: { [Op.between]: [rango.fechaInicio, rango.fechaFin] } } } : {})
        ]);

        // 1. Pagos: total, efectivo y QR, y lo pagado por cada orden
        let totalIngresos = 0;
        let totalEfectivo = 0;
        let totalQR = 0;
        const pagadoPorOrden = {};
        transacciones.forEach((t) => {
            const monto = parseFloat(t.cantidad || 0);
            totalIngresos += monto;
            if (String(t.tipo).toUpperCase().includes('EFECTIVO')) totalEfectivo += monto;
            else totalQR += monto; // QR (y cualquier otro medio que no sea efectivo)
            pagadoPorOrden[t.orden_id] = (pagadoPorOrden[t.orden_id] || 0) + monto;
        });

        // 2. Lo que valían los productos y los juegos de cada orden (precio cobrado, #22), y rankings
        //    por CANTIDAD en los dos (antes el de juegos contaba filas)
        const bruto = {};
        const rankingComida = {};
        const rankingJuegos = {};
        const sumar = (items, tipo, ranking, modelo) =>
            items.forEach((item) => {
                bruto[item.orden_id] ??= { comida: 0, juegos: 0 };
                bruto[item.orden_id][tipo] += parseFloat(item.precio_unitario) * item.cantidad;
                const nombre = item[modelo]?.nombre || 'Desconocido';
                ranking[nombre] = (ranking[nombre] || 0) + item.cantidad;
            });
        sumar(productosVendidos, 'comida', rankingComida, 'Producto');
        sumar(juegosPrestados, 'juegos', rankingJuegos, 'Juego');

        // 3. Distribución: lo pagado de cada orden, repartido según lo que valía cada tipo
        let ingresosComida = 0;
        let ingresosJuegos = 0;
        for (const id of ids) {
            const pagado = pagadoPorOrden[id] || 0;
            const { comida = 0, juegos = 0 } = bruto[id] || {};
            if (comida + juegos === 0) continue;
            ingresosComida += (pagado * comida) / (comida + juegos);
            ingresosJuegos += (pagado * juegos) / (comida + juegos);
        }

        // 4. Gráficas por día de cobro
        const porDia = {};
        cobradas.forEach((c) => {
            const dia = fechaLocal(c.fecha_cobro); // YYYY-MM-DD en hora de Bolivia (#27)
            porDia[dia] ??= { ingresos: 0, ordenes: 0 };
            porDia[dia].ingresos += pagadoPorOrden[c.orden_id] || 0;
            porDia[dia].ordenes += 1;
        });
        const etiquetas = Object.keys(porDia).sort();

        // 5. Promedios: días reales del rango, con los dos extremos ("últimos 7 días" = 7). Sin
        //    rango ("Todo"), del primer al último día con cobros.
        let dias = 1;
        if (rango) dias = diasDelRango(rango.inicio, rango.fin);
        else if (etiquetas.length > 0) dias = diasDelRango(etiquetas[0], etiquetas[etiquetas.length - 1]);

        res.status(httpCodes.OK.code).json({
            totales: {
                ingresos: redondear(totalIngresos),
                efectivo: redondear(totalEfectivo),
                qr: redondear(totalQR),
                ingresoPromedioDiario: totalIngresos / dias,
                ordenes: ids.length,
                ordenesPromedioDiario: ids.length / dias,
                reservas,
                dias
            },
            distribucion: { comida: redondear(ingresosComida), juegos: redondear(ingresosJuegos) },
            graficas: {
                etiquetas,
                ingresos: etiquetas.map((d) => redondear(porDia[d].ingresos)),
                ordenes: etiquetas.map((d) => porDia[d].ordenes)
            },
            rankings: { comidas: top5(rankingComida), juegos: top5(rankingJuegos) }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { obtenerDatosDashboard };
