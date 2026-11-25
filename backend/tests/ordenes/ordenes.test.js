'use strict';

// Órdenes: abrir, agregar productos y juegos, descuentos, notas y cobro.
// Casos T5, T6, T10, T13, P2, P3, P4, P7, P9 y P9b del análisis.
const { comoRol } = require('../soporte/api');
const { producto, juego, mesaLibre } = require('../soporte/datos');
const { ContenedorTransaccion, Producto, Juego, Mesa, Orden } = require('../../src/models');

let api;

beforeAll(async () => {
    api = await comoRol('MESERO');
});

async function abrirOrden(mesa) {
    const res = await api.post('/ordenes').send({ mesa_id: mesa.id });
    expect(res.status).toBe(201);
    return res.body.orden;
}

async function agregarProducto(orden, nombre, cantidad = 1) {
    const p = await producto(nombre);
    const res = await api.post('/ordenes-productos').send({ orden_id: orden.id, producto_id: p.id, cantidad });
    expect(res.status).toBe(201);
    return res.body;
}

async function agregarJuego(orden, nombre, cantidad = 1) {
    const j = await juego(nombre);
    const res = await api.post('/ordenes-juegos').send({ orden_id: orden.id, juego_id: j.id, cantidad });
    expect(res.status).toBe(201);
    return res.body;
}

async function totalDe(orden) {
    const res = await api.get(`/ordenes/${orden.id}`);
    expect(res.status).toBe(200);
    return Number(res.body.total);
}

// Orden de T5: 2 Cappuccino (18) + 1 Catan (25) = 61.00
async function ordenDe61() {
    const orden = await abrirOrden(await mesaLibre());
    await agregarProducto(orden, 'Cappuccino', 2);
    await agregarJuego(orden, 'Catan', 1);
    return orden;
}

describe('Abrir una orden', () => {
    test('abre la orden y la mesa pasa a ocupada', async () => {
        const mesa = await mesaLibre();
        const orden = await abrirOrden(mesa);
        expect(orden).toMatchObject({ mesa_id: mesa.id, finalizado: false });
        await mesa.reload();
        expect(mesa.estado).toBe(1);
    });

    test('sin mesa_id responde 400', async () => {
        const res = await api.post('/ordenes').send({});
        expect(res.status).toBe(400);
    });

    test.failing('P9 · abrir una orden en una mesa ocupada responde 409 (#45)', async () => {
        const mesa = await mesaLibre();
        await abrirOrden(mesa);
        const res = await api.post('/ordenes').send({ mesa_id: mesa.id });
        expect(res.status).toBe(409); // hoy 500
    });

    test.failing('P9 · dos pedidos simultáneos para la misma mesa abren una sola orden (#45)', async () => {
        const mesa = await mesaLibre();
        const respuestas = await Promise.all([
            api.post('/ordenes').send({ mesa_id: mesa.id }),
            api.post('/ordenes').send({ mesa_id: mesa.id })
        ]);
        // hoy las dos responden 201: crearOrden lee mesa.estado sin bloquear la fila y las dos
        // transacciones ven la mesa libre
        expect(await Orden.count({ where: { mesa_id: mesa.id, finalizado: false } })).toBe(1);
        expect(respuestas.map((r) => r.status).sort()).toEqual([201, 409]);
    });

    test.failing('P9b · no se puede abrir una orden en una mesa desactivada (#45)', async () => {
        const mesa = await mesaLibre({ activo: false });
        const res = await api.post('/ordenes').send({ mesa_id: mesa.id });
        expect(res.status).toBeGreaterThanOrEqual(400); // hoy 201
        expect(res.status).toBeLessThan(500);
    });
});

describe('Total de la orden', () => {
    test('T5 · 2 Cappuccino (18) + 1 Catan (25) suman 61.00', async () => {
        const orden = await ordenDe61();
        expect(await totalDe(orden)).toBe(61);
    });

    test('quitar un producto descuenta su importe del total', async () => {
        const orden = await ordenDe61();
        const item = await agregarProducto(orden, 'Sandwich de Pollo', 1);
        expect(await totalDe(orden)).toBe(96);
        const res = await api.delete(`/ordenes-productos/${item.id}`);
        expect(res.status).toBe(200);
        expect(await totalDe(orden)).toBe(61);
    });

    test('T10 · borrar del catálogo un producto que está en una orden abierta no cambia su total (#22)', async () => {
        const admin = await comoRol('ADMIN');
        const sandwich = await Producto.create({ nombre: 'Sandwich T10', precio: 35, zona: 'COCINA' });
        const orden = await abrirOrden(await mesaLibre());
        await agregarProducto(orden, 'Sandwich T10', 1);
        expect((await admin.delete(`/productos/${sandwich.id}`)).status).toBe(200);
        await agregarProducto(orden, 'Cappuccino', 1);
        expect(await totalDe(orden)).toBe(53); // antes 18: el producto borrado valía 0 al recalcular
    });

    test('T10b · borrar del catálogo un juego que está en una orden abierta no cambia su total (#22)', async () => {
        const admin = await comoRol('ADMIN');
        const j = await Juego.create({
            nombre: 'Juego T10b',
            precio: 25,
            jugadores_min: 2,
            jugadores_max: 4,
            tiempo_partida: 30
        });
        const orden = await abrirOrden(await mesaLibre());
        await agregarJuego(orden, 'Juego T10b', 1);
        expect((await admin.delete(`/juegos/${j.id}`)).status).toBe(200);
        await agregarProducto(orden, 'Cappuccino', 1);
        expect(await totalDe(orden)).toBe(43);
    });

    test('la orden sigue listando el producto y el juego borrados del catálogo, con el precio cobrado (#22)', async () => {
        const admin = await comoRol('ADMIN');
        const p = await Producto.create({ nombre: 'Producto borrado', precio: 12, zona: 'COCINA' });
        const j = await Juego.create({
            nombre: 'Juego borrado',
            precio: 15,
            jugadores_min: 2,
            jugadores_max: 4,
            tiempo_partida: 30
        });
        const orden = await abrirOrden(await mesaLibre());
        await agregarProducto(orden, 'Producto borrado', 2);
        await agregarJuego(orden, 'Juego borrado', 1);
        expect((await admin.delete(`/productos/${p.id}`)).status).toBe(200);
        expect((await admin.delete(`/juegos/${j.id}`)).status).toBe(200);

        const productos = await api.get(`/ordenes-productos?orden_id=${orden.id}`);
        expect(productos.status).toBe(200);
        expect(productos.body).toHaveLength(1);
        expect(productos.body[0]).toMatchObject({ cantidad: 2, Producto: { nombre: 'Producto borrado' } });
        expect(Number(productos.body[0].precio_unitario)).toBe(12);

        const juegos = await api.get(`/ordenes-juegos?orden_id=${orden.id}`);
        expect(juegos.status).toBe(200);
        expect(juegos.body[0]).toMatchObject({ Juego: { nombre: 'Juego borrado' } });
        expect(Number(juegos.body[0].precio_unitario)).toBe(15);
    });

    test('cambiar el precio de un producto no cambia el total de una orden abierta; las unidades nuevas van en otra línea con el precio nuevo (#22)', async () => {
        const admin = await comoRol('ADMIN');
        const p = await Producto.create({ nombre: 'Jugo precio', precio: 10, zona: 'CAFETERIA' });
        const orden = await abrirOrden(await mesaLibre());
        await agregarProducto(orden, 'Jugo precio', 2);
        await agregarProducto(orden, 'Jugo precio', 1); // mismo precio: se suma a la misma línea
        expect(await totalDe(orden)).toBe(30);

        expect((await admin.put(`/productos/${p.id}`).send({ precio: 14 })).status).toBe(200);
        await agregarProducto(orden, 'Cappuccino', 1); // fuerza el recálculo del total
        expect(await totalDe(orden)).toBe(48); // 3 × 10 + 18, no 3 × 14 + 18

        await agregarProducto(orden, 'Jugo precio', 1);
        expect(await totalDe(orden)).toBe(62); // + 1 × 14
        const { body } = await api.get(`/ordenes-productos?orden_id=${orden.id}`);
        const lineas = body
            .filter((i) => i.producto_id === p.id)
            .map((i) => [i.cantidad, Number(i.precio_unitario)])
            .sort((a, b) => a[1] - b[1]);
        expect(lineas).toEqual([
            [3, 10],
            [1, 14]
        ]);
    });

    test('editar un ítem no permite cambiar su precio cobrado (#22)', async () => {
        const orden = await abrirOrden(await mesaLibre());
        const item = await agregarProducto(orden, 'Cappuccino', 1);
        const res = await api
            .put(`/ordenes-productos/${item.id}`)
            .send({ comentario: 'sin azúcar', precio_unitario: 0 });
        expect(res.status).toBe(200);
        expect(Number(res.body.precio_unitario)).toBe(18);
        expect(await totalDe(orden)).toBe(18);
    });
});

describe('Ítems de la orden', () => {
    test.failing('P2 · cambiar la cantidad de un juego de la orden (#42)', async () => {
        const orden = await abrirOrden(await mesaLibre());
        const item = await agregarJuego(orden, 'Catan', 2);
        const res = await api.put(`/ordenes-juegos/${item.id}`).send({ cantidad: 1 });
        expect(res.status).toBe(200); // hoy 404: la ruta no existe
        expect(await totalDe(orden)).toBe(25);
    });

    test.failing('P7 · reducir la cantidad de un producto también la reduce en la comanda (#43)', async () => {
        const orden = await abrirOrden(await mesaLibre());
        const item = await agregarProducto(orden, 'Sandwich de Pollo', 3);
        const res = await api.put(`/ordenes-productos/${item.id}`).send({ cantidad: 1 });
        expect(res.status).toBe(200);
        const comandas = (await api.get('/comandas')).body;
        const comanda = comandas.find((c) => c.id === item.id);
        expect(comanda.cantidad_recibido).toBe(1); // hoy sigue en 3
    });
});

describe('Descuentos (RN-06: sin tope ni autorización)', () => {
    test('P3 · el MESERO aplica un descuento del 100 % y el total queda en 0.00', async () => {
        const orden = await ordenDe61();
        const res = await api.post(`/ordenes/${orden.id}/descuento`).send({ porcentaje: 100, comentario: 'cortesía' });
        expect(res.status).toBe(200);
        expect(await totalDe(orden)).toBe(0);
    });

    test('P4 · un descuento de monto mayor al total deja el total en 0.00, nunca negativo', async () => {
        const orden = await ordenDe61();
        const res = await api.post(`/ordenes/${orden.id}/descuento`).send({ monto: 9999, comentario: 'prueba' });
        expect(res.status).toBe(200);
        expect(await totalDe(orden)).toBe(0);
    });

    test('un descuento del 10 % sobre 61.00 deja 54.90, y al quitarlo vuelve a 61.00', async () => {
        const orden = await ordenDe61();
        const res = await api.post(`/ordenes/${orden.id}/descuento`).send({ porcentaje: 10, comentario: 'prueba' });
        expect(res.status).toBe(200);
        expect(await totalDe(orden)).toBeCloseTo(54.9, 2);
        const quitar = await api.delete(`/ordenes/${orden.id}/descuento/${res.body.descuento.id}`);
        expect(quitar.status).toBe(200);
        expect(await totalDe(orden)).toBe(61);
    });

    test('sin porcentaje ni monto responde 400', async () => {
        const orden = await ordenDe61();
        const res = await api.post(`/ordenes/${orden.id}/descuento`).send({ comentario: 'nada' });
        expect(res.status).toBe(400);
    });
});

describe('Cobro', () => {
    test('finalizar sin detalle de pagos registra un pago EFECTIVO por el total y libera la mesa', async () => {
        const orden = await ordenDe61();
        const res = await api.post(`/ordenes/${orden.id}/finalizar`).send({});
        expect(res.status).toBe(200);
        const pagos = await ContenedorTransaccion.findAll({ where: { orden_id: orden.id }, raw: true });
        expect(pagos.map((p) => [p.tipo, Number(p.cantidad)])).toEqual([['EFECTIVO', 61]]);
        const mesa = await Mesa.findByPk(orden.mesa_id);
        expect(mesa.estado).toBe(0);
    });

    test('una orden ya cobrada no se puede volver a cobrar', async () => {
        const orden = await ordenDe61();
        expect((await api.post(`/ordenes/${orden.id}/finalizar`).send({})).status).toBe(200);
        const res = await api.post(`/ordenes/${orden.id}/finalizar`).send({});
        expect(res.status).toBeGreaterThanOrEqual(400);
    });

    test.failing('T6 · finalizar con QR 30 + EFECTIVO 31 registra los dos pagos (#21)', async () => {
        const orden = await ordenDe61();
        const res = await api.post(`/ordenes/${orden.id}/finalizar`).send({
            pagos: [
                { tipo: 'QR', monto: 30 },
                { tipo: 'EFECTIVO', monto: 31 }
            ]
        });
        expect(res.status).toBe(200);
        const pagos = await ContenedorTransaccion.findAll({
            where: { orden_id: orden.id },
            order: [['tipo', 'DESC']],
            raw: true
        });
        // hoy: una sola transacción EFECTIVO 61.00
        expect(pagos.map((p) => [p.tipo, Number(p.cantidad)])).toEqual([
            ['QR', 30],
            ['EFECTIVO', 31]
        ]);
    });

    test.failing('T13 · las notas de una orden cobrada no se pueden editar: 409 (#41)', async () => {
        const orden = await ordenDe61();
        expect((await api.post(`/ordenes/${orden.id}/finalizar`).send({})).status).toBe(200);
        const res = await api.put(`/ordenes/${orden.id}`).send({ notas: 'cambio después de cobrar' });
        expect(res.status).toBe(409); // hoy 200
    });
});
