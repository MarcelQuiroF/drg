'use strict';

// Pedidos simultáneos sobre una misma orden (#124): clics rápidos en el POS o dos meseros en la
// misma mesa. Cada prueba manda más pedidos a la vez que conexiones tiene el pool de Sequelize
// (5), como P9c de #45: así también se comprueba que el bloqueo no agota el pool.
const { comoRol } = require('../soporte/api');
const { producto, juego, mesaLibre } = require('../soporte/datos');
const { ContenedorProducto, ContenedorJuego, ContenedorTransaccion, Orden } = require('../../src/models');

// Más que el pool por defecto de Sequelize (max: 5)
const PEDIDOS = 8;

let api;
let cajero;

beforeAll(async () => {
    api = await comoRol('MESERO');
    cajero = await comoRol('CAJERO');
});

async function abrirOrden() {
    const mesa = await mesaLibre();
    const res = await api.post('/ordenes').send({ mesa_id: mesa.id });
    expect(res.status).toBe(201);
    return res.body.orden;
}

// Pedidos alternados entre el mesero y el cajero (dos personas en la misma mesa)
const clientes = (n) => Array.from({ length: n }, (_, i) => (i % 2 === 0 ? api : cajero));

const pedirProducto = (cliente, ordenId, productoId, cantidad = 1) =>
    cliente.post('/ordenes-productos').send({ orden_id: ordenId, producto_id: productoId, cantidad });

const pedirJuego = (cliente, ordenId, juegoId, cantidad = 1) =>
    cliente.post('/ordenes-juegos').send({ orden_id: ordenId, juego_id: juegoId, cantidad });

// Suma de cantidad × precio cobrado de las líneas que siguen en la orden (sin descuentos)
async function sumaDeLineas(ordenId) {
    const lineas = [
        ...(await ContenedorProducto.findAll({ where: { orden_id: ordenId } })),
        ...(await ContenedorJuego.findAll({ where: { orden_id: ordenId } }))
    ];
    return lineas.reduce((suma, l) => suma + l.cantidad * Number(l.precio_unitario), 0);
}

async function totalGuardado(ordenId) {
    const orden = await Orden.findByPk(ordenId, { paranoid: false });
    return Number(orden.total);
}

describe('#124 · agregar ítems a la vez a la misma orden', () => {
    test('8 pedidos simultáneos de un producto que ya está en la orden suman las 8 unidades', async () => {
        const cappuccino = await producto('Cappuccino');
        const orden = await abrirOrden();
        expect((await pedirProducto(api, orden.id, cappuccino.id)).status).toBe(201);

        const respuestas = await Promise.all(clientes(PEDIDOS).map((c) => pedirProducto(c, orden.id, cappuccino.id)));
        expect(respuestas.map((r) => r.status)).toEqual(Array(PEDIDOS).fill(201));

        const lineas = await ContenedorProducto.findAll({ where: { orden_id: orden.id } });
        expect(lineas).toHaveLength(1);
        // antes quedaban 3 o 4 unidades: cada pedido leía la misma cantidad y guardaba "cantidad + 1"
        expect(lineas[0].cantidad).toBe(1 + PEDIDOS);
        expect(lineas[0].cantidad_recibido).toBe(1 + PEDIDOS);
        expect(await totalGuardado(orden.id)).toBe(18 * (1 + PEDIDOS));
    });

    test('8 pedidos simultáneos de un producto que todavía no está en la orden crean una sola línea', async () => {
        const sandwich = await producto('Sandwich de Pollo');
        const orden = await abrirOrden();

        const respuestas = await Promise.all(clientes(PEDIDOS).map((c) => pedirProducto(c, orden.id, sandwich.id)));
        expect(respuestas.map((r) => r.status)).toEqual(Array(PEDIDOS).fill(201));

        const lineas = await ContenedorProducto.findAll({ where: { orden_id: orden.id } });
        // antes dos pedidos no encontraban la línea y la creaban dos veces
        expect(lineas.map((l) => l.cantidad)).toEqual([PEDIDOS]);
        expect(await totalGuardado(orden.id)).toBe(35 * PEDIDOS);
    });

    test('productos y juegos distintos a la vez: el total guardado es la suma de las líneas', async () => {
        const [cappuccino, sandwich, catan, kittens] = await Promise.all([
            producto('Cappuccino'),
            producto('Sandwich de Pollo'),
            juego('Catan'),
            juego('Exploding Kittens')
        ]);
        // Se repite: la carrera no se da siempre en la primera vuelta
        for (let vuelta = 0; vuelta < 3; vuelta++) {
            const orden = await abrirOrden();
            const respuestas = await Promise.all([
                pedirProducto(api, orden.id, cappuccino.id),
                pedirProducto(cajero, orden.id, sandwich.id, 2),
                pedirJuego(api, orden.id, catan.id),
                pedirJuego(cajero, orden.id, kittens.id),
                pedirProducto(cajero, orden.id, cappuccino.id),
                pedirJuego(api, orden.id, kittens.id, 2),
                pedirProducto(api, orden.id, sandwich.id),
                pedirJuego(cajero, orden.id, catan.id)
            ]);
            expect(respuestas.map((r) => r.status)).toEqual(Array(8).fill(201));

            // 2 × 18 + 3 × 35 + 2 × 25 + 3 × 10 = 221
            expect(await sumaDeLineas(orden.id)).toBe(221);
            // antes el total quedaba por debajo (60 o 78 en lugar de 88 en la sesión 4.2)
            expect(await totalGuardado(orden.id)).toBe(221);
        }
    });
});

describe('#124 · cambiar y borrar ítems mientras se agregan otros', () => {
    test('PUT /ordenes-productos/:id y pedidos nuevos a la vez dejan el total igual a las líneas', async () => {
        const [cappuccino, sandwich] = await Promise.all([producto('Cappuccino'), producto('Sandwich de Pollo')]);
        for (let vuelta = 0; vuelta < 3; vuelta++) {
            const orden = await abrirOrden();
            const linea = (await pedirProducto(api, orden.id, sandwich.id)).body;

            const respuestas = await Promise.all([
                api.put(`/ordenes-productos/${linea.id}`).send({ cantidad: 3 }),
                ...clientes(PEDIDOS - 1).map((c) => pedirProducto(c, orden.id, cappuccino.id))
            ]);
            expect(respuestas.map((r) => r.status)).toEqual([200, ...Array(PEDIDOS - 1).fill(201)]);

            // 3 × 35 + 7 × 18 = 231
            expect(await sumaDeLineas(orden.id)).toBe(231);
            expect(await totalGuardado(orden.id)).toBe(231);
        }
    });

    test('borrar un producto y un juego mientras se agregan otros deja el total igual a las líneas', async () => {
        const [cappuccino, sandwich, catan] = await Promise.all([
            producto('Cappuccino'),
            producto('Sandwich de Pollo'),
            juego('Catan')
        ]);
        for (let vuelta = 0; vuelta < 3; vuelta++) {
            const orden = await abrirOrden();
            const lineaSandwich = (await pedirProducto(api, orden.id, sandwich.id)).body;
            const lineaCatan = (await pedirJuego(api, orden.id, catan.id)).body;
            await pedirProducto(api, orden.id, cappuccino.id);

            const respuestas = await Promise.all([
                api.delete(`/ordenes-productos/${lineaSandwich.id}`),
                cajero.delete(`/ordenes-juegos/${lineaCatan.id}`),
                ...clientes(PEDIDOS - 2).map((c) => pedirProducto(c, orden.id, cappuccino.id))
            ]);
            expect(respuestas.map((r) => r.status)).toEqual([200, 200, ...Array(PEDIDOS - 2).fill(201)]);

            // queda solo el Cappuccino: 1 + 6 unidades = 126
            expect(await sumaDeLineas(orden.id)).toBe(126);
            expect(await totalGuardado(orden.id)).toBe(126);
        }
    });

    test('un descuento aplicado mientras se agregan ítems se calcula sobre todas las líneas', async () => {
        const cappuccino = await producto('Cappuccino');
        for (let vuelta = 0; vuelta < 3; vuelta++) {
            const orden = await abrirOrden();
            await pedirProducto(api, orden.id, cappuccino.id);

            const respuestas = await Promise.all([
                cajero.post(`/ordenes/${orden.id}/descuento`).send({ porcentaje: 50, comentario: 'prueba #124' }),
                ...clientes(PEDIDOS - 1).map((c) => pedirProducto(c, orden.id, cappuccino.id))
            ]);
            expect(respuestas.map((r) => r.status)).toEqual([200, ...Array(PEDIDOS - 1).fill(201)]);

            // 8 Cappuccino = 144, con 50 % de descuento = 72
            expect(await sumaDeLineas(orden.id)).toBe(144);
            expect(await totalGuardado(orden.id)).toBe(72);
        }
    });
});

describe('#124 · cocina y cobro mientras se agregan ítems', () => {
    test('avanzar la comanda de una línea mientras se le suman unidades no pierde unidades', async () => {
        const cappuccino = await producto('Cappuccino');
        for (let vuelta = 0; vuelta < 3; vuelta++) {
            const orden = await abrirOrden();
            const linea = (await pedirProducto(api, orden.id, cappuccino.id, 4)).body;

            const respuestas = await Promise.all([
                cajero.post(`/comandas/${linea.id}/avanzar`).send({ estado_origen: 'RECIBIDO', cantidad: 2 }),
                ...clientes(PEDIDOS - 1).map((c) => pedirProducto(c, orden.id, cappuccino.id))
            ]);
            expect(respuestas.map((r) => r.status)).toEqual([200, ...Array(PEDIDOS - 1).fill(201)]);

            const final = await ContenedorProducto.findByPk(linea.id);
            expect(final.cantidad).toBe(4 + PEDIDOS - 1);
            // los contadores de la cocina tienen que sumar la cantidad pedida
            expect(final.cantidad_recibido + final.cantidad_preparando).toBe(final.cantidad);
            expect(final.cantidad_preparando).toBe(2);
        }
    });

    test('cobrar la orden mientras se agregan ítems: lo que queda en la orden cobrada es lo que se pagó', async () => {
        const cappuccino = await producto('Cappuccino');
        for (let vuelta = 0; vuelta < 3; vuelta++) {
            const orden = await abrirOrden();
            await pedirProducto(api, orden.id, cappuccino.id);

            const respuestas = await Promise.all([
                cajero.post(`/ordenes/${orden.id}/finalizar`).send({ pagos: [{ tipo: 'EFECTIVO', monto: 18 }] }),
                ...clientes(PEDIDOS - 1).map((c) => pedirProducto(c, orden.id, cappuccino.id))
            ]);

            const pagado = (await ContenedorTransaccion.findAll({ where: { orden_id: orden.id } })).reduce(
                (suma, t) => suma + Number(t.cantidad),
                0
            );
            const cerrada = await Orden.findByPk(orden.id);
            if (cerrada.finalizado) {
                // antes se colaban ítems después del cobro: la orden cerrada tenía más de lo pagado
                expect(await sumaDeLineas(orden.id)).toBe(pagado);
                expect(Number(cerrada.total)).toBe(pagado);
                // los pedidos que llegaron después del cobro se rechazan con 409
                for (const r of respuestas.slice(1)) expect([201, 409]).toContain(r.status);
            } else {
                // el cobro llegó tarde: el total ya había cambiado y se rechaza sin cobrar nada
                expect(respuestas[0].status).toBe(400);
                expect(pagado).toBe(0);
            }
        }
    });
});
