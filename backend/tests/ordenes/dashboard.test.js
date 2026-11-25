'use strict';

// Dashboard (GET /reportes/dashboard): casos F3 y T14/F4 del análisis.
// Las órdenes se fechan a un día pasado fijo (fecharOrden) y se consulta "Esta semana" vista
// desde ese día, para que el resultado no dependa del día ni de la hora en que corre la prueba
// (#27). El mediodía evita los bordes de la zona horaria.
const { comoRol } = require('../soporte/api');
const { producto, juego, mesaLibre, fecharOrden } = require('../soporte/datos');

// Cada prueba usa su propia semana para no sumar las órdenes de las otras (la base se
// reinicia una vez por archivo).
const mediodia = (dia) => `${dia}T12:00:00-04:00`;
const semanaHasta = (dia) => {
    const inicio = new Date(`${dia}T00:00:00Z`);
    inicio.setUTCDate(inicio.getUTCDate() - 7);
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
        expect((await mesero.post(`/ordenes/${cobrada.id}/finalizar`).send({})).status).toBe(200);
        const abierta = await ordenDe61();
        await fecharOrden(cobrada.id, mediodia('2026-06-15'));
        await fecharOrden(abierta.id, mediodia('2026-06-15'));
        datos = await dashboard('2026-06-15');
    });

    test('ingresos totales: 61.00 (solo lo cobrado)', () => {
        expect(datos.totales.ingresos).toBe(61);
    });

    test.failing('gráfica de ingresos: 61.00, sin la orden abierta (#31)', () => {
        expect(datos.graficas.etiquetas).toEqual(['2026-06-15']);
        expect(datos.graficas.ingresos).toEqual([61]); // hoy 122: suma Orden.total de las dos
    });

    test.failing('total de órdenes: 1, sin la orden abierta (#31)', () => {
        expect(datos.totales.ordenes).toBe(1); // hoy 2
    });

    test.failing('ingreso promedio diario de la semana: 61 / 7 (#31)', () => {
        expect(datos.totales.ingresoPromedioDiario).toBeCloseTo(61 / 7, 2); // hoy 61 / 8
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

    test.failing('T14 / F4 · después de cobrar con QR 30 + EFECTIVO 31, el dashboard muestra QR 30 (#21)', async () => {
        const orden = await ordenDe61();
        await mesero.post(`/ordenes/${orden.id}/finalizar`).send({
            pagos: [
                { tipo: 'QR', monto: 30 },
                { tipo: 'EFECTIVO', monto: 31 }
            ]
        });
        await fecharOrden(orden.id, mediodia('2026-04-15'));
        const { totales } = await dashboard('2026-04-15');
        expect(totales).toMatchObject({ ingresos: 61, qr: 30, efectivo: 31 }); // hoy QR 0 y efectivo 61
    });
});

describe('Rankings', () => {
    test.failing('el ranking de juegos suma cantidades, como el de comida (#31)', async () => {
        const orden = await ordenDe61(); // 2 Cappuccino y 1 Catan
        const exploding = await juego('Exploding Kittens');
        await mesero.post('/ordenes-juegos').send({ orden_id: orden.id, juego_id: exploding.id, cantidad: 3 });
        await fecharOrden(orden.id, mediodia('2026-03-15'));
        const { rankings } = await dashboard('2026-03-15');
        expect(rankings.comidas).toContainEqual(['Cappuccino', 2]);
        expect(rankings.juegos).toContainEqual(['Exploding Kittens', 3]); // hoy 1: cuenta filas
    });
});
