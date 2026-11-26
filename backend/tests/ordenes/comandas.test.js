'use strict';

// Comandas de cocina y cafetería (GET /comandas, POST /comandas/:id/avanzar). Caso T7 del análisis.
const { comoRol, cobrarEnEfectivo } = require('../soporte/api');
const { producto, mesaLibre } = require('../soporte/datos');
const { ContenedorProducto, Producto } = require('../../src/models');

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
    test('un ítem de una orden cobrada no aparece en las comandas (#33)', async () => {
        const { orden, item } = await pedir('Sandwich de Pollo');
        expect((await cobrarEnEfectivo(api, orden.id)).status).toBe(200);
        expect(await idsEnComandas()).not.toContain(item.id); // antes aparecía
    });

    test('un ítem de una orden borrada no aparece en las comandas (#33)', async () => {
        const { orden, item } = await pedir('Sandwich de Pollo');
        expect((await api.delete(`/ordenes/${orden.id}`)).status).toBe(200);
        expect(await idsEnComandas()).not.toContain(item.id); // antes aparecía, sin orden
    });

    test('ninguna comanda llega sin orden ni con una orden cobrada', async () => {
        const cobrada = await pedir('Cappuccino');
        await cobrarEnEfectivo(api, cobrada.orden.id);
        await pedir('Sandwich de Pollo');
        const comandas = (await api.get('/comandas')).body;
        expect(comandas.length).toBeGreaterThan(0);
        comandas.forEach((c) => expect(c.Orden).toMatchObject({ finalizado: false }));
    });
});

describe('Producto borrado del catálogo con unidades pendientes (hallazgo de la 4.1, #33)', () => {
    async function pedirProductoQueSeBorra(zona) {
        const p = await Producto.create({ nombre: `Se borra ${zona}`, precio: 10, zona });
        const mesa = await mesaLibre();
        const orden = (await api.post('/ordenes').send({ mesa_id: mesa.id })).body.orden;
        const item = (await api.post('/ordenes-productos').send({ orden_id: orden.id, producto_id: p.id, cantidad: 2 }))
            .body;
        await p.destroy(); // borrado lógico desde el panel
        return { p, item, orden };
    }

    test('sigue en las comandas, con su nombre, y en el filtro de su zona', async () => {
        const { item } = await pedirProductoQueSeBorra('COCINA');
        const comanda = (await api.get('/comandas')).body.find((c) => c.id === item.id);
        expect(comanda).toBeDefined(); // antes desaparecía de la cocina
        expect(comanda.Producto).toMatchObject({ nombre: 'Se borra COCINA', zona: 'COCINA' });
        expect(await idsEnComandas('COCINA')).toContain(item.id);
        expect(await idsEnComandas('CAFETERIA')).not.toContain(item.id);
    });

    test('se puede avanzar hasta entregarla y entonces sale de la lista', async () => {
        const { item } = await pedirProductoQueSeBorra('CAFETERIA');
        for (const origen of ['RECIBIDO', 'PREPARANDO', 'TERMINADO']) {
            expect((await api.post(`/comandas/${item.id}/avanzar`).send({ estado_origen: origen })).status).toBe(200);
        }
        expect(await idsEnComandas()).not.toContain(item.id);
    });
});

describe('Avanzar una comanda sigue bloqueando la orden (#124)', () => {
    test('avanzar mientras el mesero suma unidades no pierde ninguna', async () => {
        const { orden, item } = await pedir('Sandwich de Pollo', 4);
        const sandwich = await producto('Sandwich de Pollo');
        await Promise.all([
            ...Array.from({ length: 4 }, () =>
                api.post('/ordenes-productos').send({ orden_id: orden.id, producto_id: sandwich.id, cantidad: 1 })
            ),
            ...Array.from({ length: 4 }, () =>
                api.post(`/comandas/${item.id}/avanzar`).send({ estado_origen: 'RECIBIDO', cantidad: 1 })
            )
        ]);
        const linea = await ContenedorProducto.findByPk(item.id);
        expect(linea.cantidad).toBe(8);
        expect(linea.cantidad_recibido + linea.cantidad_preparando).toBe(8);
        expect(linea.cantidad_preparando).toBe(4);
    });

    test('la cocina puede terminar de entregar lo de una orden ya cobrada (aunque ya no la liste)', async () => {
        const { orden, item } = await pedir('Cappuccino');
        await cobrarEnEfectivo(api, orden.id);
        expect((await api.post(`/comandas/${item.id}/avanzar`).send({})).status).toBe(200);
    });
});
