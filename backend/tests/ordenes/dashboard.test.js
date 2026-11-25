'use strict';

// Dashboard (GET /reportes/dashboard): casos F3, F3b y T14/F4 del análisis. Desde #31 todo sale
// de las órdenes COBRADAS y sus pagos, y cada orden cuenta el día de su cobro.
// Las órdenes se fechan a un día pasado fijo (fecharOrden) y se consulta "Esta semana" vista
// desde ese día, para que el resultado no dependa del día ni de la hora en que corre la prueba
// (#27). El mediodía evita los bordes de la zona horaria.
const { comoRol, cobrarEnEfectivo } = require('../soporte/api');
const { producto, juego, mesaLibre, fecharOrden } = require('../soporte/datos');

// Cada prueba usa su propia semana para no sumar las órdenes de las otras (la base se
// reinicia una vez por archivo).
const mediodia = (dia) => `${dia}T12:00:00-04:00`;
// "Últimos 7 días", como el filtro del panel: el día y los 6 anteriores (antes -7, que eran 8, #31)
const semanaHasta = (dia) => {
    const inicio = new Date(`${dia}T00:00:00Z`);
    inicio.setUTCDate(inicio.getUTCDate() - 6);
    return { inicio: inicio.toISOString().slice(0, 10), fin: dia };
};

let mesero;
let admin;

beforeAll(async () => {
    mesero = await comoRol('MESERO');
    admin = await comoRol('ADMIN');
});

async function ordenDe61() {
    const mesa = await mesaLibre();
    const orden = (await mesero.post('/ordenes').send({ mesa_id: mesa.id })).body.orden;
    const cappuccino = await producto('Cappuccino');
    const catan = await juego('Catan');
    await mesero.post('/ordenes-productos').send({ orden_id: orden.id, producto_id: cappuccino.id, cantidad: 2 });
    await mesero.post('/ordenes-juegos').send({ orden_id: orden.id, juego_id: catan.id, cantidad: 1 });
    return orden;
}

async function dashboard(dia) {
    const res = await admin.get('/reportes/dashboard').query(semanaHasta(dia));
    expect(res.status).toBe(200);
    return res.body;
}

describe('F3 · una orden cobrada de 61.00 y otra abierta, vistas en "Esta semana"', () => {
    let datos;

    beforeAll(async () => {
        const cobrada = await ordenDe61();
        expect((await cobrarEnEfectivo(mesero, cobrada.id)).status).toBe(200);
        const abierta = await ordenDe61();
        await fecharOrden(cobrada.id, mediodia('2026-06-15'));
        await fecharOrden(abierta.id, mediodia('2026-06-15'));
        datos = await dashboard('2026-06-15');
    });

    test('ingresos totales: 61.00 (solo lo cobrado)', () => {
        expect(datos.totales.ingresos).toBe(61);
    });

    test('gráfica de ingresos: 61.00, sin la orden abierta (#31)', () => {
        expect(datos.graficas.etiquetas).toEqual(['2026-06-15']);
        expect(datos.graficas.ingresos).toEqual([61]); // antes 122: sumaba Orden.total de las dos
        expect(datos.graficas.ordenes).toEqual([1]);
    });

    test('total de órdenes: 1, sin la orden abierta (#31)', () => {
        expect(datos.totales.ordenes).toBe(1); // antes 2
    });

    test('ingreso promedio diario de la semana: 61 / 7 (#31)', () => {
        expect(datos.totales.dias).toBe(7);
        expect(datos.totales.ingresoPromedioDiario).toBeCloseTo(61 / 7, 2); // antes 61 / 8
        expect(datos.totales.ordenesPromedioDiario).toBeCloseTo(1 / 7, 4);
    });

    test('la distribución comida/juegos suma lo cobrado y no incluye la orden abierta', () => {
        expect(datos.distribucion).toEqual({ comida: 36, juegos: 25 }); // antes 72 y 50
    });
});

describe('Pagos por tipo', () => {
    test('el dashboard separa EFECTIVO y QR cuando las transacciones tienen el tipo correcto', async () => {
        const orden = await ordenDe61();
        const crear = (tipo, cantidad) => mesero.post('/pagos').send({ orden_id: orden.id, tipo, cantidad });
        expect((await crear('QR', 30)).status).toBe(201);
        expect((await crear('EFECTIVO', 31)).status).toBe(201);
        await fecharOrden(orden.id, mediodia('2026-05-15'));
        const { totales } = await dashboard('2026-05-15');
        expect(totales).toMatchObject({ ingresos: 61, qr: 30, efectivo: 31 });
    });

    test('T14 / F4 · después de cobrar con QR 30 + EFECTIVO 31, el dashboard muestra QR 30 (#21)', async () => {
        const orden = await ordenDe61();
        const cobro = await mesero.post(`/ordenes/${orden.id}/finalizar`).send({
            pagos: [
                { tipo: 'QR', monto: 30 },
                { tipo: 'EFECTIVO', monto: 31 }
            ]
        });
        expect(cobro.status).toBe(200);
        await fecharOrden(orden.id, mediodia('2026-04-15'));
        const { totales } = await dashboard('2026-04-15');
        expect(totales).toMatchObject({ ingresos: 61, qr: 30, efectivo: 31 });
    });
});

describe('Ingresos por comida y juegos', () => {
    test('usan el precio cobrado, aunque después cambie el precio del catálogo (#22)', async () => {
        const orden = await ordenDe61(); // 2 Cappuccino (18) y 1 Catan (25)
        expect((await cobrarEnEfectivo(mesero, orden.id)).status).toBe(200); // solo cuenta lo cobrado (#31)
        const cappuccino = await producto('Cappuccino');
        const catan = await juego('Catan');
        expect((await admin.put(`/productos/${cappuccino.id}`).send({ precio: 30 })).status).toBe(200);
        expect((await admin.put(`/juegos/${catan.id}`).send({ precio: 99 })).status).toBe(200);
        await fecharOrden(orden.id, mediodia('2026-02-15'));
        const { distribucion } = await dashboard('2026-02-15');
        expect(distribucion).toEqual({ comida: 36, juegos: 25 }); // antes 60 y 99: el precio actual
        // Deja los precios como estaban para las demás pruebas del archivo
        await admin.put(`/productos/${cappuccino.id}`).send({ precio: 18 });
        await admin.put(`/juegos/${catan.id}`).send({ precio: 25 });
    });
});

describe('Rankings', () => {
    test('el ranking de juegos suma cantidades, como el de comida (#31)', async () => {
        const orden = await ordenDe61(); // 2 Cappuccino y 1 Catan
        const exploding = await juego('Exploding Kittens');
        await mesero.post('/ordenes-juegos').send({ orden_id: orden.id, juego_id: exploding.id, cantidad: 3 });
        expect((await cobrarEnEfectivo(mesero, orden.id)).status).toBe(200);
        await fecharOrden(orden.id, mediodia('2026-03-15'));
        const { rankings } = await dashboard('2026-03-15');
        expect(rankings.comidas).toContainEqual(['Cappuccino', 2]);
        expect(rankings.juegos).toContainEqual(['Exploding Kittens', 3]); // antes 1: contaba filas
    });
});

describe('Una sola fuente: las órdenes cobradas, el día de su cobro (#31)', () => {
    const { ContenedorTransaccion, Orden } = require('../../src/models');

    test('un pago parcial de una orden abierta no cuenta hasta que la orden se cobra', async () => {
        const orden = await ordenDe61();
        expect((await mesero.post('/pagos').send({ orden_id: orden.id, tipo: 'QR', cantidad: 20 })).status).toBe(201);
        await fecharOrden(orden.id, mediodia('2025-10-10'));
        const antes = await dashboard('2025-10-10');
        expect(antes.totales).toMatchObject({ ingresos: 0, qr: 0, ordenes: 0 });
        expect(antes.graficas.etiquetas).toEqual([]);

        expect((await mesero.post('/pagos').send({ orden_id: orden.id, tipo: 'EFECTIVO', cantidad: 41 })).status).toBe(
            201
        );
        await fecharOrden(orden.id, mediodia('2025-10-10'));
        const despues = await dashboard('2025-10-10');
        expect(despues.totales).toMatchObject({ ingresos: 61, qr: 20, efectivo: 41, ordenes: 1 });
    });

    test('una orden abierta un día y cobrada al siguiente cuenta el día del cobro', async () => {
        const orden = await ordenDe61();
        expect((await cobrarEnEfectivo(mesero, orden.id)).status).toBe(200);
        await fecharOrden(orden.id, mediodia('2025-10-20')); // abierta y con ítems el 20
        await ContenedorTransaccion.update(
            { fecha: new Date('2025-10-21T23:30:00-04:00') },
            { where: { orden_id: orden.id } }
        );
        const dia = (d) => admin.get('/reportes/dashboard').query({ inicio: d, fin: d });
        expect((await dia('2025-10-20')).body.totales).toMatchObject({ ingresos: 0, ordenes: 0 });
        const del21 = (await dia('2025-10-21')).body;
        expect(del21.totales).toMatchObject({ ingresos: 61, ordenes: 1, dias: 1 });
        expect(del21.graficas.etiquetas).toEqual(['2025-10-21']); // 23:30 de Bolivia, ya 22 en UTC
        expect(del21.distribucion).toEqual({ comida: 36, juegos: 25 });
        expect(del21.rankings.comidas).toEqual([['Cappuccino', 2]]);
    });

    test('con un descuento, comida + juegos = lo cobrado (se reparte en proporción)', async () => {
        const orden = await ordenDe61(); // 36 de comida y 25 de juegos
        const descuento = await mesero.post(`/ordenes/${orden.id}/descuento`).send({ monto: 11, comentario: '#31' });
        expect(descuento.status).toBe(200);
        expect((await cobrarEnEfectivo(mesero, orden.id)).status).toBe(200);
        await fecharOrden(orden.id, mediodia('2025-11-05'));
        const { totales, distribucion } = await dashboard('2025-11-05');
        expect(totales.ingresos).toBe(50);
        expect(distribucion.comida + distribucion.juegos).toBeCloseTo(50, 2);
        expect(distribucion.comida).toBeCloseTo((50 * 36) / 61, 2);
    });

    test('una orden cobrada y después borrada no cuenta', async () => {
        const orden = await ordenDe61();
        expect((await cobrarEnEfectivo(mesero, orden.id)).status).toBe(200);
        await fecharOrden(orden.id, mediodia('2025-11-20'));
        await Orden.destroy({ where: { id: orden.id } });
        expect((await dashboard('2025-11-20')).totales).toMatchObject({ ingresos: 0, ordenes: 0 });
    });

    test('un rango de un día divide por 1, y uno del 1 al 31 por 31', async () => {
        const dia = await admin.get('/reportes/dashboard').query({ inicio: '2025-12-15', fin: '2025-12-15' });
        expect(dia.body.totales.dias).toBe(1);
        const mes = await admin.get('/reportes/dashboard').query({ inicio: '2025-12-01', fin: '2025-12-31' });
        expect(mes.body.totales.dias).toBe(31);
    });

    test('un rango incompleto o al revés responde 400', async () => {
        expect((await admin.get('/reportes/dashboard').query({ inicio: '2025-10-10' })).status).toBe(400);
        const alReves = await admin.get('/reportes/dashboard').query({ inicio: '2025-10-10', fin: '2025-10-01' });
        expect(alReves.status).toBe(400);
    });
});
