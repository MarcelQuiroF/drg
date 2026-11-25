'use strict';

// Modelos frente a la base (#28): lo que la base exige y el modelo no validaba responde 400 (y no
// 500 "Error en la base de datos"); los valores por defecto de la base coinciden con los modelos;
// y un borrado físico no se lleva el historial en cascada.
const { comoRol } = require('../soporte/api');
const { producto, juego, mesaLibre } = require('../soporte/datos');
const {
    Asistencia,
    Cliente,
    ContenedorJuego,
    ContenedorProducto,
    DescuentoAtraso,
    Empleado,
    Horario,
    Orden,
    Reserva,
    sequelize
} = require('../../src/models');

let admin;
let mesero;

beforeAll(async () => {
    admin = await comoRol('ADMIN');
    mesero = await comoRol('MESERO');
});

const texto = (n) => 'x'.repeat(n);

describe('Largos de las columnas varchar: 400 en lugar de 500', () => {
    test('un teléfono de cliente de más de 20 caracteres responde 400, al crear y al editar', async () => {
        const largo = await mesero.post('/clientes').send({ nombre: 'Tel largo', telefono: texto(21) });
        expect(largo.status).toBe(400); // antes 500
        expect(largo.body.message).toMatch(/teléfono.*20/);

        const ok = await mesero.post('/clientes').send({ nombre: 'Tel justo', telefono: texto(20) });
        expect(ok.status).toBe(201);
        const editado = await mesero.put(`/clientes/${ok.body.id ?? ok.body.data?.id}`).send({ telefono: texto(25) });
        expect(editado.status).toBe(400);
    });

    test('un nombre de producto de más de 100 caracteres responde 400', async () => {
        const res = await admin.post('/productos').send({ nombre: texto(101), precio: 5, zona: 'COCINA' });
        expect(res.status).toBe(400);
    });

    test('un CI de empleado de más de 20 caracteres responde 400', async () => {
        const res = await admin
            .post('/empleados')
            .send({ nombre: 'CI largo', ci: texto(21), contrasenia: 'una-contrasenia', rol: 'MESERO' });
        expect(res.status).toBe(400);
    });
});

describe('Campos obligatorios en la base', () => {
    test('T4 · una mesa con el nombre vacío responde 400', async () => {
        const piso = (await admin.get('/pisos')).body[0];
        const res = await admin.post('/mesas').send({ nombre: '', numero: 63, piso_id: piso.id });
        expect(res.status).toBe(400);
    });

    test.each([
        ['0 minutos', 0],
        ['un texto', 'mucho'],
        ['null', null]
    ])('C2 · un juego con tiempo_partida %s responde 400', async (_caso, tiempo) => {
        const res = await admin
            .post('/juegos')
            .send({ nombre: 'Juego C2', precio: 10, jugadores_min: 2, jugadores_max: 4, tiempo_partida: tiempo });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/tiempo de partida/i);
    });

    test('C2 · el juego con tiempo_partida se crea (lo que manda ahora el formulario del panel)', async () => {
        const res = await admin
            .post('/juegos')
            .send({ nombre: 'Juego C2 ok', precio: 10, jugadores_min: 2, jugadores_max: 4, tiempo_partida: '45' });
        expect(res.status).toBe(201);
        expect(res.body.tiempo_partida).toBe(45);
    });

    test('T11 · una llegada con un horario de otro empleado responde 400', async () => {
        const otro = await Empleado.create({ nombre: 'Otro', ci: '9200001LP', contrasenia: 'x', rol: 'MESERO' });
        const yo = await Empleado.create({ nombre: 'Yo', ci: '9200002LP', contrasenia: 'x', rol: 'MESERO' });
        const horarioAjeno = await Horario.create({ dia: 'LUNES', hora_entrada: '08:00:00', empleado_id: otro.id });
        const cajero = await comoRol('CAJERO');
        const res = await cajero
            .post('/asistencias')
            .send({ empleado_id: yo.id, horario_id: horarioAjeno.id, estado: 'PRESENTE' });
        expect(res.status).toBe(400);
        expect(await Asistencia.count({ where: { empleado_id: yo.id } })).toBe(0);
    });
});

describe('Valores por defecto de la base', () => {
    test('una orden insertada sin "finalizado" queda abierta (antes DEFAULT true en la base)', async () => {
        const mesa = await mesaLibre();
        const [[fila]] = await sequelize.query(
            `INSERT INTO orden (mesa_id, total, "createdAt", "updatedAt") VALUES (${mesa.id}, 0, now(), now()) RETURNING finalizado`
        );
        expect(fila.finalizado).toBe(false);
    });

    test('una asistencia insertada sin "aprobado" queda sin aprobar (antes DEFAULT true en la base)', async () => {
        const e = await Empleado.create({ nombre: 'Default', ci: '9200003LP', contrasenia: 'x', rol: 'MESERO' });
        const h = await Horario.create({ dia: 'LUNES', hora_entrada: '08:00:00', empleado_id: e.id });
        const [[fila]] = await sequelize.query(
            `INSERT INTO asistencia (empleado_id, horario_id, estado, fecha_hora_llegada, "createdAt", "updatedAt")
             VALUES (${e.id}, ${h.id}, 'PRESENTE', now(), now(), now()) RETURNING aprobado`
        );
        expect(fila.aprobado).toBe(false);
    });
});

describe('Un borrado físico no se lleva el historial (ON DELETE RESTRICT)', () => {
    // Borra la fila de verdad (sin el borrado lógico de Sequelize), como un DELETE a mano
    const borrarFisico = (tabla, id) => sequelize.query(`DELETE FROM ${tabla} WHERE id = ${id}`);
    const esRestriccion = expect.objectContaining({ name: 'SequelizeForeignKeyConstraintError' });

    async function asistenciaDe() {
        const e = await Empleado.create({
            nombre: 'Historial',
            ci: `93${Date.now() % 100000}LP`,
            contrasenia: 'x',
            rol: 'MESERO'
        });
        const h = await Horario.create({ dia: 'LUNES', hora_entrada: '08:00:00', empleado_id: e.id });
        const d = await DescuentoAtraso.create({
            cantidad_tiempo: '01:00:00',
            descuento: 0,
            descuento_porcentual: 5
        });
        const a = await Asistencia.create({
            empleado_id: e.id,
            horario_id: h.id,
            descuento_id: d.id,
            estado: 'PRESENTE'
        });
        return { e, h, d, a };
    }

    test('no se puede borrar un descuento de atraso, un horario ni un empleado con asistencias', async () => {
        const { e, h, d, a } = await asistenciaDe();
        await expect(borrarFisico('descuento_atraso', d.id)).rejects.toEqual(esRestriccion);
        await expect(borrarFisico('horario', h.id)).rejects.toEqual(esRestriccion);
        await expect(borrarFisico('empleado', e.id)).rejects.toEqual(esRestriccion);
        // antes, con CASCADE, la asistencia desaparecía
        expect(await Asistencia.findByPk(a.id)).not.toBeNull();
    });

    test('no se puede borrar un producto ni un juego que están en una orden', async () => {
        const p = await producto('Cappuccino');
        const j = await juego('Catan');
        const mesa = await mesaLibre();
        const orden = (await mesero.post('/ordenes').send({ mesa_id: mesa.id })).body.orden;
        await mesero.post('/ordenes-productos').send({ orden_id: orden.id, producto_id: p.id, cantidad: 1 });
        await mesero.post('/ordenes-juegos').send({ orden_id: orden.id, juego_id: j.id, cantidad: 1 });

        await expect(borrarFisico('producto', p.id)).rejects.toEqual(esRestriccion);
        await expect(borrarFisico('juego', j.id)).rejects.toEqual(esRestriccion);
        expect(await ContenedorProducto.count({ where: { orden_id: orden.id } })).toBe(1);
        expect(await ContenedorJuego.count({ where: { orden_id: orden.id } })).toBe(1);
    });

    test('no se puede borrar un cliente ni una mesa con reservas', async () => {
        const mesa = await mesaLibre();
        const cliente = await Cliente.create({ nombre: 'Con reserva', ci: '9300001' });
        const hora = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        const reserva = await Reserva.create({ cliente_id: cliente.id, mesa_id: mesa.id, hora });
        await expect(borrarFisico('cliente', cliente.id)).rejects.toEqual(esRestriccion);
        await expect(borrarFisico('mesa', mesa.id)).rejects.toEqual(esRestriccion);
        expect(await Reserva.findByPk(reserva.id)).not.toBeNull();
    });

    test('borrar una orden sí borra sus ítems (son parte de la orden)', async () => {
        const mesa = await mesaLibre();
        const orden = (await mesero.post('/ordenes').send({ mesa_id: mesa.id })).body.orden;
        const p = await producto('Cappuccino');
        await mesero.post('/ordenes-productos').send({ orden_id: orden.id, producto_id: p.id, cantidad: 1 });
        await borrarFisico('orden', orden.id);
        expect(await ContenedorProducto.count({ where: { orden_id: orden.id }, paranoid: false })).toBe(0);
        expect(await Orden.findByPk(orden.id, { paranoid: false })).toBeNull();
    });
});
