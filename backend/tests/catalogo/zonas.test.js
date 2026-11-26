'use strict';

// Zona de un producto como lista cerrada: COCINA o CAFETERIA (P1, RF-14, #32). Se valida en el
// CRUD, en la importación por Excel y en la base (CHECK producto_zona_valida).
const xlsx = require('xlsx');
const { comoRol } = require('../soporte/api');
const { sequelize, Producto } = require('../../src/models');
const { QueryTypes } = require('sequelize');

let admin;
let categoriaId;

beforeAll(async () => {
    admin = await comoRol('ADMIN');
    const res = await admin.post('/categorias').send({ nombre: 'Categoría #32' });
    categoriaId = res.body.id ?? res.body.data?.id;
});

const crear = (zona, nombre = `Producto ${zona}`) => admin.post('/productos').send({ nombre, precio: 10, zona });

function excel(filas) {
    const libro = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(libro, xlsx.utils.json_to_sheet(filas), 'Productos');
    return xlsx.write(libro, { type: 'buffer', bookType: 'xlsx' });
}

const importar = (filas) => admin.post('/importacion/productos').attach('archivoExcel', excel(filas), 'productos.xlsx');

describe('CRUD de productos', () => {
    test.each([
        ['COCINA', 'COCINA'],
        ['cocina', 'COCINA'],
        [' Cafetería ', 'CAFETERIA'],
        ['CAFETERIA', 'CAFETERIA']
    ])('la zona %p se guarda como %p', async (enviada, guardada) => {
        const res = await crear(enviada, `Producto ${enviada.trim()} ${Math.random()}`);
        expect(res.status).toBe(201);
        const producto = await Producto.findOne({ where: { nombre: res.body.nombre ?? res.body.data?.nombre } });
        expect(producto.zona).toBe(guardada);
    });

    test.each([['Barra'], ['BARRA'], ['Postres'], [''], ['JUEGO']])('la zona %p responde 400', async (zona) => {
        const res = await crear(zona);
        expect(res.status).toBe(400);
        expect(JSON.stringify(res.body)).toMatch(/COCINA o CAFETERIA/);
    });

    test('sin zona responde 400 (antes 500: la columna es NOT NULL)', async () => {
        const res = await admin.post('/productos').send({ nombre: 'Sin zona', precio: 10 });
        expect(res.status).toBe(400);
    });

    test('editar un producto a una zona inválida responde 400 y no cambia nada', async () => {
        const creado = await crear('COCINA', 'Para editar #32');
        const id = creado.body.id ?? creado.body.data?.id;
        expect((await admin.put(`/productos/${id}`).send({ zona: 'Barra' })).status).toBe(400);
        expect((await Producto.findByPk(id)).zona).toBe('COCINA');
        expect((await admin.put(`/productos/${id}`).send({ zona: 'cafeteria' })).status).toBe(200);
        expect((await Producto.findByPk(id)).zona).toBe('CAFETERIA');
    });

    test('los productos del seed tienen todos una zona válida (aparecen en el POS)', async () => {
        const zonas = await Producto.findAll({ attributes: ['zona'], paranoid: false });
        expect(zonas.length).toBeGreaterThan(0);
        zonas.forEach((p) => expect(['COCINA', 'CAFETERIA']).toContain(p.zona));
    });
});

describe('Importación por Excel', () => {
    test('importa con la zona normalizada', async () => {
        const res = await importar([
            { nombre: 'Importado cocina', zona: 'Cocina', precio: 5, imagen: '', categoria_id: categoriaId },
            { nombre: 'Importado cafetería', zona: 'cafetería', precio: 6, imagen: '', categoria_id: categoriaId }
        ]);
        expect(res.status).toBe(200);
        expect((await Producto.findOne({ where: { nombre: 'Importado cocina' } })).zona).toBe('COCINA');
        expect((await Producto.findOne({ where: { nombre: 'Importado cafetería' } })).zona).toBe('CAFETERIA');
    });

    test('una zona inválida responde 400 con la fila y no importa ninguna fila', async () => {
        const res = await importar([
            { nombre: 'Fila buena', zona: 'COCINA', precio: 5, imagen: '', categoria_id: categoriaId },
            { nombre: 'Fila mala', zona: 'Barra', precio: 5, imagen: '', categoria_id: categoriaId }
        ]);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/"Barra" de la fila 3/);
        expect(await Producto.count({ where: { nombre: ['Fila buena', 'Fila mala'] } })).toBe(0);
    });
});

describe('La base', () => {
    test('rechaza una zona inválida aunque el INSERT no pase por la API', async () => {
        await expect(
            sequelize.query(
                `INSERT INTO producto (nombre, precio, zona, "createdAt", "updatedAt") VALUES ('Directo', 1, 'Barra', now(), now())`
            )
        ).rejects.toThrow(/producto_zona_valida/);
    });

    test('la restricción es un CHECK con COCINA y CAFETERIA', async () => {
        const [fila] = await sequelize.query(
            `SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conname = 'producto_zona_valida'`,
            { type: QueryTypes.SELECT }
        );
        expect(fila.def).toMatch(/CHECK/);
        expect(fila.def).toMatch(/COCINA/);
        expect(fila.def).toMatch(/CAFETERIA/);
    });
});
