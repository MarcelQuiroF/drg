'use strict';

// Mover una orden abierta a otra mesa (#38, RF-55, RN-15).
const { comoRol, cobrarEnEfectivo } = require('../soporte/api');
const { producto, juego, mesaLibre } = require('../soporte/datos');
const { Orden, Mesa, Piso, Cliente, ContenedorTransaccion, sequelize } = require('../../src/models');

let mesero;
let cajero;
let cliente;

beforeAll(async () => {
    mesero = await comoRol('MESERO');
    cajero = await comoRol('CAJERO');
    cliente = await Cliente.create({ nombre: 'Cliente de la reserva' });
});

async function abrirOrden(mesa, { productos = [], juegos = [] } = {}) {
    const res = await mesero.post('/ordenes').send({ mesa_id: mesa.id });
    expect(res.status).toBe(201);
    const orden = res.body.orden;
    for (const [nombre, cantidad] of productos) {
        const p = await producto(nombre);
        const r = await mesero.post('/ordenes-productos').send({ orden_id: orden.id, producto_id: p.id, cantidad });
        expect(r.status).toBe(201);
    }
    for (const [nombre, cantidad] of juegos) {
        const j = await juego(nombre);
        const r = await mesero.post('/ordenes-juegos').send({ orden_id: orden.id, juego_id: j.id, cantidad });
        expect(r.status).toBe(201);
    }
    return orden;
}

const mover = (api, ordenId, mesaId) => api.post(`/ordenes/${ordenId}/mover`).send({ mesa_id: mesaId });

// Reserva PENDIENTE a `minutos` de ahora (negativo: ya pasó su hora). Por SQL porque el modelo no
// deja guardar una hora pasada (isFuture).
async function reservar(mesa, minutos) {
    await sequelize.query(
        `INSERT INTO reserva (hora, estado, cliente_id, mesa_id, "createdAt", "updatedAt")
         VALUES (now() + make_interval(mins => :minutos), 'PENDIENTE', :cliente, :mesa, now(), now())`,
        { replacements: { minutos, cliente: cliente.id, mesa: mesa.id } }
    );
}

async function estadoDe(mesa) {
    await mesa.reload();
    return mesa.estado;
}

describe('MV1 · mover una orden abierta a una mesa libre', () => {
    test('la orden pasa a la mesa nueva con todo lo suyo; la de origen queda libre y la de destino ocupada', async () => {
        const origen = await mesaLibre();
        const destino = await mesaLibre();
        const orden = await abrirOrden(origen, { productos: [['Cappuccino', 2]], juegos: [['Catan', 1]] });
        await mesero.post(`/ordenes/${orden.id}/descuento`).send({ monto: 5, comentario: 'Cumpleaños' });
        // Pago parcial (cuenta dividida): sigue colgando de la orden
        expect((await cajero.post('/pagos').send({ orden_id: orden.id, tipo: 'QR', cantidad: 20 })).status).toBe(201);
        const antes = (await mesero.get(`/ordenes/${orden.id}`)).body;

        const res = await mover(mesero, orden.id, destino.id);
        expect(res.status).toBe(200);
        expect(res.body.orden.mesa_id).toBe(destino.id);

        const despues = (await mesero.get(`/ordenes/${orden.id}`)).body;
        expect(despues.mesa_id).toBe(destino.id);
        expect(despues.total).toBe(antes.total); // 2 × 18 + 25 − 5 = 56
        expect(Number(despues.total)).toBe(56);
        expect((await mesero.get(`/ordenes-productos?orden_id=${orden.id}`)).body).toHaveLength(1);
        expect((await mesero.get(`/ordenes-juegos?orden_id=${orden.id}`)).body).toHaveLength(1);
        expect((await mesero.get(`/ordenes/${orden.id}/descuentos`)).body).toHaveLength(1);
        expect(await ContenedorTransaccion.count({ where: { orden_id: orden.id } })).toBe(1);

        expect(await estadoDe(origen)).toBe(0);
        expect(await estadoDe(destino)).toBe(1);
        expect((await mesero.get(`/ordenes?mesa_id=${origen.id}`)).body).toHaveLength(0);
        expect((await mesero.get(`/ordenes?mesa_id=${destino.id}`)).body.map((o) => o.id)).toEqual([orden.id]);
    });

    test('la mesa de origen acepta una orden nueva y la orden movida se cobra en la mesa nueva', async () => {
        const origen = await mesaLibre();
        const destino = await mesaLibre();
        const orden = await abrirOrden(origen, { productos: [['Cappuccino', 1]] });
        expect((await mover(cajero, orden.id, destino.id)).status).toBe(200);

        expect((await mesero.post('/ordenes').send({ mesa_id: origen.id })).status).toBe(201);
        expect((await cobrarEnEfectivo(cajero, orden.id)).status).toBe(200);
        expect(await estadoDe(destino)).toBe(0);
    });

    test('las comandas pendientes muestran la mesa nueva', async () => {
        const origen = await mesaLibre({ nombre: 'Mesa de origen' });
        const destino = await mesaLibre({ nombre: 'Mesa de destino' });
        const orden = await abrirOrden(origen, { productos: [['Cappuccino', 1]] });
        expect((await mover(mesero, orden.id, destino.id)).status).toBe(200);

        const comandas = (await mesero.get('/comandas')).body;
        const lista = Array.isArray(comandas) ? comandas : comandas.data;
        const deLaOrden = lista.filter((c) => c.orden_id === orden.id);
        expect(deLaOrden.length).toBeGreaterThan(0);
        for (const c of deLaOrden) expect(c.Orden.Mesa.nombre).toBe('Mesa de destino');
    });
});

describe('MV2 · la mesa de destino tiene que estar libre y sin reserva próxima (RN-15): 409 sin cambiar nada', () => {
    async function intentar(prepararDestino, estado, mensaje) {
        const origen = await mesaLibre();
        const destino = await mesaLibre();
        const orden = await abrirOrden(origen, { productos: [['Cappuccino', 1]] });
        await prepararDestino(destino);

        const res = await mover(mesero, orden.id, destino.id);
        expect(res.status).toBe(estado);
        expect(res.body.message).toMatch(mensaje);
        expect((await Orden.findByPk(orden.id)).mesa_id).toBe(origen.id);
        expect(await estadoDe(origen)).toBe(1);
    }

    test('ocupada (con otra orden abierta)', () => intentar((d) => abrirOrden(d), 409, /ocupada/));

    test('con una reserva dentro de la ventana de bloqueo (en 90 min; ventana 120)', () =>
        intentar((d) => reservar(d, 90), 409, /reserva a las/));

    test('con una reserva atrasada que todavía está dentro de la tolerancia (hace 10 min)', () =>
        intentar((d) => reservar(d, -10), 409, /reserva a las/));

    test('desactivada', () => intentar((d) => d.update({ activo: false }), 409, /desactivada/));

    test('de un piso desactivado', async () => {
        const piso = await Piso.create({ numero: 90, nombre: 'Terraza cerrada', activo: false });
        await intentar((d) => d.update({ piso_id: piso.id }), 409, /piso/);
    });

    test('inexistente: 404', async () => {
        const origen = await mesaLibre();
        const orden = await abrirOrden(origen);
        expect((await mover(mesero, orden.id, 999999)).status).toBe(404);
    });

    test('borrada: 404', () => intentar((d) => d.destroy(), 404, /no existe/));
});

describe('MV3 · casos que sí se pueden o que no tienen sentido', () => {
    test('una reserva fuera de la ventana (en 3 h) no impide mover', async () => {
        const origen = await mesaLibre();
        const destino = await mesaLibre();
        await reservar(destino, 180);
        const orden = await abrirOrden(origen);
        expect((await mover(mesero, orden.id, destino.id)).status).toBe(200);
    });

    test('una reserva vencida (pasó la tolerancia, hace 45 min) no impide mover', async () => {
        const origen = await mesaLibre();
        const destino = await mesaLibre();
        await reservar(destino, -45);
        const orden = await abrirOrden(origen);
        expect((await mover(mesero, orden.id, destino.id)).status).toBe(200);
    });

    test('sin mesa_id o a la misma mesa: 400', async () => {
        const origen = await mesaLibre();
        const orden = await abrirOrden(origen);
        expect((await mesero.post(`/ordenes/${orden.id}/mover`).send({})).status).toBe(400);
        expect((await mover(mesero, orden.id, 'abc')).status).toBe(400);
        const misma = await mover(mesero, orden.id, origen.id);
        expect(misma.status).toBe(400);
        expect(misma.body.message).toMatch(/ya está en esa mesa/);
    });

    test('una orden cobrada no se mueve (409) y una que no existe da 404', async () => {
        const origen = await mesaLibre();
        const destino = await mesaLibre();
        const orden = await abrirOrden(origen, { productos: [['Cappuccino', 1]] });
        expect((await cobrarEnEfectivo(cajero, orden.id)).status).toBe(200);
        expect((await mover(mesero, orden.id, destino.id)).status).toBe(409);
        expect((await mover(mesero, 999999, destino.id)).status).toBe(404);
        expect(await estadoDe(destino)).toBe(0);
    });
});

describe('MV4 · movimientos a la vez (bloqueo de las dos mesas por id)', () => {
    test('dos movimientos cruzados a la vez (A→B y B→A, 5 veces): los dos 409 (destino ocupado) y nunca un deadlock (500)', async () => {
        for (let i = 0; i < 5; i++) {
            const a = await mesaLibre();
            const b = await mesaLibre();
            const enA = await abrirOrden(a);
            const enB = await abrirOrden(b);
            // Cada movimiento bloquea su orden y después las dos mesas. Si cada uno bloqueara primero
            // su mesa de origen, uno tendría A y esperaría B y el otro al revés: deadlock (500).
            const respuestas = await Promise.all([mover(mesero, enA.id, b.id), mover(cajero, enB.id, a.id)]);
            const estados = respuestas.map((r) => r.status);
            expect(estados).not.toContain(500);
            // Las dos mesas están ocupadas: los dos movimientos chocan con una mesa ocupada
            expect(estados).toEqual([409, 409]);
            expect((await Orden.findByPk(enA.id)).mesa_id).toBe(a.id);
            expect((await Orden.findByPk(enB.id)).mesa_id).toBe(b.id);
        }
    });

    test('cruce real: A→B mientras B se va a C y C vuelve a A, todo a la vez: sin deadlocks ni dos órdenes en una mesa', async () => {
        for (let i = 0; i < 5; i++) {
            const [a, b, c] = [await mesaLibre(), await mesaLibre(), await mesaLibre()];
            const enA = await abrirOrden(a);
            const enB = await abrirOrden(b);
            const respuestas = await Promise.all([
                mover(mesero, enA.id, b.id), // necesita que B se haya ido
                mover(cajero, enB.id, c.id), // C está libre
                mover(mesero, enB.id, a.id) // compite con el anterior por la misma orden
            ]);
            expect(respuestas.map((r) => r.status)).not.toContain(500);
            for (const mesa of [a, b, c]) {
                expect(await Orden.count({ where: { mesa_id: mesa.id, finalizado: false } })).toBeLessThanOrEqual(1);
                const ocupada = (await Orden.count({ where: { mesa_id: mesa.id, finalizado: false } })) === 1;
                expect(await estadoDe(mesa)).toBe(ocupada ? 1 : 0);
            }
        }
    });

    test('dos órdenes a la misma mesa libre a la vez: una entra (200) y la otra recibe 409', async () => {
        const destino = await mesaLibre();
        const o1 = await abrirOrden(await mesaLibre());
        const o2 = await abrirOrden(await mesaLibre());
        const respuestas = await Promise.all([mover(mesero, o1.id, destino.id), mover(cajero, o2.id, destino.id)]);
        expect(respuestas.map((r) => r.status).sort()).toEqual([200, 409]);
        expect(await Orden.count({ where: { mesa_id: destino.id, finalizado: false } })).toBe(1);
    });

    test('mover y cobrar la misma orden a la vez no se traban (orden → mesas, como el cobro)', async () => {
        for (let i = 0; i < 5; i++) {
            const origen = await mesaLibre();
            const destino = await mesaLibre();
            const orden = await abrirOrden(origen, { productos: [['Cappuccino', 1]] });
            const [movida, cobrada] = await Promise.all([
                mover(mesero, orden.id, destino.id),
                cajero.post(`/ordenes/${orden.id}/finalizar`).send({ pagos: [{ tipo: 'EFECTIVO', monto: 18 }] })
            ]);
            expect([movida.status, cobrada.status]).not.toContain(500);
            expect(cobrada.status).toBe(200);
            // Las dos mesas quedan libres: la orden se cobró (antes o después de moverse)
            expect(await estadoDe(origen)).toBe(0);
            expect(await estadoDe(destino)).toBe(0);
            expect(await Mesa.count({ where: { id: [origen.id, destino.id], estado: 1 } })).toBe(0);
        }
    });
});
