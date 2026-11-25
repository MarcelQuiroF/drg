'use strict';

// Comandas de cocina y cafetería (GET /comandas, POST /comandas/:id/avanzar). Caso T7 del análisis.
const { comoRol, cobrarEnEfectivo } = require('../soporte/api');
const { producto, mesaLibre } = require('../soporte/datos');

let api;

beforeAll(async () => {
    api = await comoRol('MESERO');
});

// Abre una orden en una mesa nueva con un producto y devuelve la orden y el ítem.
async function pedir(nombre, cantidad = 1) {
    const mesa = await mesaLibre();
    const orden = (await api.post('/ordenes').send({ mesa_id: mesa.id })).body.orden;
    const p = await producto(nombre);
    const res = await api.post('/ordenes-productos').send({ orden_id: orden.id, producto_id: p.id, cantidad });
    expect(res.status).toBe(201);
    return { orden, item: res.body };
}

async function idsEnComandas(zona) {
    const res = await api.get('/comandas').query(zona ? { zona } : {});
    expect(res.status).toBe(200);
    return res.body.map((c) => c.id);
}

describe('Listado de comandas', () => {
    test('un producto pedido aparece en las comandas, recibido', async () => {
        const { item } = await pedir('Sandwich de Pollo', 2);
        const comandas = (await api.get('/comandas')).body;
        expect(comandas.find((c) => c.id === item.id)).toMatchObject({ cantidad: 2, cantidad_recibido: 2 });
    });

    test('el filtro por zona separa cocina de cafetería', async () => {
        const { item: sandwich } = await pedir('Sandwich de Pollo');
        const { item: cappuccino } = await pedir('Cappuccino');
        const cocina = await idsEnComandas('COCINA');
        const cafeteria = await idsEnComandas('CAFETERIA');
        expect(cocina).toContain(sandwich.id);
        expect(cocina).not.toContain(cappuccino.id);
        expect(cafeteria).toContain(cappuccino.id);
        expect(cafeteria).not.toContain(sandwich.id);
    });

    test('al avanzar recibido → preparando → terminado → enviado, el ítem sale de la lista', async () => {
        const { item } = await pedir('Cappuccino');
        for (const esperado of ['cantidad_preparando', 'cantidad_terminado', 'cantidad_enviado']) {
            const res = await api.post(`/comandas/${item.id}/avanzar`).send({});
            expect(res.status).toBe(200);
            expect(res.body.item[esperado]).toBe(1);
        }
        expect(await idsEnComandas()).not.toContain(item.id);
    });
});

describe('T7 · comandas de órdenes que ya no están en curso', () => {
    test.failing('un ítem de una orden cobrada no aparece en las comandas (#33)', async () => {
        const { orden, item } = await pedir('Sandwich de Pollo');
        expect((await cobrarEnEfectivo(api, orden.id)).status).toBe(200);
        expect(await idsEnComandas()).not.toContain(item.id); // hoy aparece
    });

    test.failing('un ítem de una orden borrada no aparece en las comandas (#33)', async () => {
        const { orden, item } = await pedir('Sandwich de Pollo');
        expect((await api.delete(`/ordenes/${orden.id}`)).status).toBe(200);
        expect(await idsEnComandas()).not.toContain(item.id); // hoy aparece, sin orden
    });
});
