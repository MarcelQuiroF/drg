'use strict';

// Cantidad de personas de la reserva (#40, RF-25): se pide siempre, pero puede quedar vacía. Si
// supera la capacidad de la mesa, se guarda igual y el servidor avisa (decisión de Marcelo,
// ⚠ confirmar con el dueño).
const { comoRol } = require('../soporte/api');
const { mesaLibre } = require('../soporte/datos');
const { Cliente, Reserva, sequelize } = require('../../src/models');

let api;
let cliente;
let desfase = 0;

beforeAll(async () => {
    api = await comoRol('CAJERO');
    cliente = await Cliente.create({ nombre: 'Familia Pérez', telefono: '70000001' });
});

// Cada reserva en su mesa (capacidad 4) y en otro día, para que no choquen entre sí
async function reservar(datos = {}, mesa) {
    const m = mesa || (await mesaLibre({ cantidadMaxima: 4 }));
    desfase += 1;
    const hora = new Date(Date.now() + (24 + desfase * 5) * 60 * 60 * 1000).toISOString();
    return api.post('/reservas').send({ cliente_id: cliente.id, mesa_id: m.id, hora, ...datos });
}

describe('PR1 · la cantidad de personas se guarda y se muestra', () => {
    test('con un entero positivo se guarda y aparece en la lista de reservas', async () => {
        const res = await reservar({ cantidad_personas: 3 });
        expect(res.status).toBe(201);
        expect(res.body.cantidad_personas).toBe(3);
        expect(res.body.aviso).toBeNull();

        const lista = (await api.get('/reservas')).body;
        const fila = lista.find((r) => r.id === res.body.id);
        expect(fila.cantidad_personas).toBe(3);
        expect(fila.Mesa.cantidadMaxima).toBe(4); // para que la lista marque las que superan la capacidad
    });

    test('es opcional: sin el campo, vacío ("") o null queda sin dato', async () => {
        for (const datos of [{}, { cantidad_personas: '' }, { cantidad_personas: null }]) {
            const res = await reservar(datos);
            expect(res.status).toBe(201);
            expect((await Reserva.findByPk(res.body.id)).cantidad_personas).toBeNull();
        }
    });

    test('el número como texto ("5", lo que manda un formulario) se acepta', async () => {
        const res = await reservar({ cantidad_personas: '2' });
        expect(res.status).toBe(201);
        expect((await Reserva.findByPk(res.body.id)).cantidad_personas).toBe(2);
    });

    test('se puede cambiar al editar la reserva, y también borrar', async () => {
        const { body } = await reservar({ cantidad_personas: 2 });
        const cambio = await api.put(`/reservas/${body.id}`).send({ cantidad_personas: 4 });
        expect(cambio.status).toBe(200);
        expect(cambio.body.data.cantidad_personas).toBe(4);
        const borrar = await api.put(`/reservas/${body.id}`).send({ cantidad_personas: '' });
        expect(borrar.status).toBe(200);
        expect((await Reserva.findByPk(body.id)).cantidad_personas).toBeNull();
    });
});

describe('PR2 · solo enteros positivos: 400 y no se guarda nada', () => {
    test.each([
        ['0', 0],
        ['negativo', -2],
        ['decimal', 2.5],
        ['texto', 'muchos'],
        ['fuera del rango de un entero', 3000000000]
    ])('%s', async (_caso, valor) => {
        const antes = await Reserva.count();
        const res = await reservar({ cantidad_personas: valor });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/cantidad de personas/);
        expect(await Reserva.count()).toBe(antes);
    });

    test('al editar, un valor inválido responde 400 y no cambia la reserva', async () => {
        const { body } = await reservar({ cantidad_personas: 2 });
        const res = await api.put(`/reservas/${body.id}`).send({ cantidad_personas: 0 });
        expect(res.status).toBe(400);
        expect((await Reserva.findByPk(body.id)).cantidad_personas).toBe(2);
    });

    test('la base también lo rechaza (CHECK reserva_personas_positiva), aunque sea un UPDATE a mano', async () => {
        const { body } = await reservar({ cantidad_personas: 2 });
        await expect(
            sequelize.query('UPDATE reserva SET cantidad_personas = 0 WHERE id = :id', {
                replacements: { id: body.id }
            })
        ).rejects.toMatchObject({ parent: expect.objectContaining({ constraint: 'reserva_personas_positiva' }) });
    });
});

describe('PR3 · más personas que la capacidad de la mesa: se guarda y se avisa', () => {
    test('al crear: 201 con el aviso', async () => {
        const mesa = await mesaLibre({ nombre: 'Mesa chica', cantidadMaxima: 4 });
        const res = await reservar({ cantidad_personas: 6 }, mesa);
        expect(res.status).toBe(201);
        expect(res.body.cantidad_personas).toBe(6);
        expect(res.body.aviso).toBe('La reserva es para 6 personas y la mesa Mesa chica tiene capacidad para 4.');
    });

    test('justo la capacidad no avisa', async () => {
        const res = await reservar({ cantidad_personas: 4 });
        expect(res.body.aviso).toBeNull();
    });

    test('al editar (o al cambiar a una mesa más chica): 200 con el aviso', async () => {
        const grande = await mesaLibre({ nombre: 'Mesa grande', cantidadMaxima: 8 });
        const chica = await mesaLibre({ nombre: 'Mesa de dos', cantidadMaxima: 2 });
        const { body } = await reservar({ cantidad_personas: 6 }, grande);
        expect(body.aviso).toBeNull();
        const res = await api.put(`/reservas/${body.id}`).send({ mesa_id: chica.id });
        expect(res.status).toBe(200);
        expect(res.body.aviso).toMatch(/6 personas y la mesa Mesa de dos tiene capacidad para 2/);
    });
});
