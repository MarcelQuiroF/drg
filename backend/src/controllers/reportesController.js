const { Orden, ContenedorProducto, ContenedorJuego, ContenedorTransaccion, Reserva, Producto, Juego } = require('../models');
const httpCodes = require('../utils/httpCodes');
const { Op } = require('sequelize');

async function obtenerDatosDashboard(req, res, next) {
    try {
        let { inicio, fin } = req.query;
        
        // Si no mandan fechas, usamos un rango muy amplio (Todos los registros)
        const fechaInicio = inicio ? new Date(`${inicio}T00:00:00.000Z`) : new Date('2000-01-01');
        const fechaFin = fin ? new Date(`${fin}T23:59:59.999Z`) : new Date('2100-01-01');

        const rangoFechas = { [Op.between]: [fechaInicio, fechaFin] };

        // 1. Ejecutar todas las consultas en paralelo para máxima velocidad
        const [ordenes, transacciones, reservas, productosVendidos, juegosJugados] = await Promise.all([
            Orden.findAll({ attributes: ['id', 'total', 'createdAt'], where: { createdAt: rangoFechas } }),
            ContenedorTransaccion.findAll({ attributes: ['cantidad', 'tipo'], where: { fecha: rangoFechas } }),
            Reserva.count({ where: { createdAt: rangoFechas } }),
            ContenedorProducto.findAll({ include: [{ model: Producto, attributes: ['nombre', 'precio'] }], where: { createdAt: rangoFechas } }),
            ContenedorJuego.findAll({ include: [{ model: Juego, attributes: ['nombre', 'precio'] }], where: { createdAt: rangoFechas } })
        ]);

        // 2. Procesar Transacciones (QR vs Efectivo)
        let totalIngresos = 0, totalEfectivo = 0, totalQR = 0;
        transacciones.forEach(t => {
            const monto = parseFloat(t.cantidad || 0);
            totalIngresos += monto;
            if (t.tipo.toUpperCase().includes('EFECTIVO')) totalEfectivo += monto;
            else totalQR += monto; // Transferencias, QR, Tarjeta
        });

        // 3. Procesar Comida vs Juegos y Rankings
        let ingresosComida = 0, ingresosJuegos = 0;
        const rankingComidaMap = {}, rankingJuegosMap = {};

        productosVendidos.forEach(cp => {
            const precio = parseFloat(cp.Producto?.precio || 0);
            ingresosComida += (precio * cp.cantidad);
            const nombre = cp.Producto?.nombre || 'Desconocido';
            rankingComidaMap[nombre] = (rankingComidaMap[nombre] || 0) + cp.cantidad;
        });

        juegosJugados.forEach(cj => {
            const precio = parseFloat(cj.Juego?.precio || 0);
            ingresosJuegos += (precio * cj.cantidad); // O solo el precio si se cobra por hora independiente
            const nombre = cj.Juego?.nombre || 'Desconocido';
            rankingJuegosMap[nombre] = (rankingJuegosMap[nombre] || 0) + 1; // 1 vez por orden
        });

        // 4. Agrupar Órdenes e Ingresos por Fecha (Para las gráficas de líneas)
        const timelineMap = {};
        ordenes.forEach(o => {
            const fechaStr = new Date(o.createdAt).toISOString().split('T')[0]; // YYYY-MM-DD
            if (!timelineMap[fechaStr]) timelineMap[fechaStr] = { ingresos: 0, cantidad: 0 };
            timelineMap[fechaStr].ingresos += parseFloat(o.total || 0);
            timelineMap[fechaStr].cantidad += 1;
        });

        // Ordenar el timeline cronológicamente
        const timelineFechas = Object.keys(timelineMap).sort();
        const timelineIngresos = timelineFechas.map(f => timelineMap[f].ingresos);
        const timelineOrdenes = timelineFechas.map(f => timelineMap[f].cantidad);

        // 5. Calcular Promedios
        const diasDiferencia = Math.max(1, Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)));
        // Si piden "Todos los registros", usamos los días reales con datos
        const diasEfectivos = inicio ? diasDiferencia : Math.max(1, timelineFechas.length); 

        // Formatear Rankings (Top 5)
        const topComidas = Object.entries(rankingComidaMap).sort((a,b) => b[1] - a[1]).slice(0, 5);
        const topJuegos = Object.entries(rankingJuegosMap).sort((a,b) => b[1] - a[1]).slice(0, 5);

        // 6. Armar respuesta
        res.status(httpCodes.OK.code).json({
            totales: {
                ingresos: totalIngresos,
                efectivo: totalEfectivo,
                qr: totalQR,
                ingresoPromedioDiario: totalIngresos / diasEfectivos,
                ordenes: ordenes.length,
                ordenesPromedioDiario: ordenes.length / diasEfectivos,
                reservas: reservas
            },
            distribucion: { comida: ingresosComida, juegos: ingresosJuegos },
            graficas: {
                etiquetas: timelineFechas,
                ingresos: timelineIngresos,
                ordenes: timelineOrdenes
            },
            rankings: {
                comidas: topComidas,
                juegos: topJuegos
            }
        });

    } catch (error) { next(error); }
}

module.exports = { obtenerDatosDashboard };