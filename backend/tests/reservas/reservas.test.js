'use strict';

// Reservas: crear, cruces de horario, edición, llegada automática y vencimiento.
// Casos T9, T9b, T9c, R2 y R3 del análisis. Las horas se calculan desde "ahora" y los minutos
// de las ventanas se leen de la configuración, para no depender del valor del seed.
const { comoRol } = require('../soporte/api');
const { mesaLibre } = require('../soporte/datos');
const { Cliente, Configuracion, Reserva, Mesa, sequelize } = require('../../src/models');

let api;
let cliente;

const minutos = (n) => new Date(Date.now() + n * 60 * 1000);
const config = async (clave) => (await Configuracion.findOne({ where: { clave }, rejectOnEmpty: true })).valor;

beforeAll(async () => {
    api = await comoRol('MESERO');
    cliente = await Cliente.create({ nombre: 'Cliente de prueba', telefono: '70000000' });
});

// La API no deja crear reservas en el pasado: se crean en el futuro y se mueve la hora en la base.
async function moverHora(id, hora) {
    await sequelize.query('UPDATE reserva SET hora = :hora WHERE id = :id', { replacements: { hora, id } });
}

function reservar(mesa, hora) {
    return api.post('/reservas').send({ cliente_id: cliente.id, mesa_id: mesa.id, hora: hora.toISOString() });
}

describe('Crear una reserva', () => {
    test('una reserva futura en una mesa libre se crea PENDIENTE', async () => {
        const mesa = await mesaLibre();
        const res = await reservar(mesa, minutos(24 * 60));
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ mesa_id: mesa.id, estado: 'PENDIENTE' });
    });

    test('una reserva con hora pasada se rechaza con 400', async () => {
        const res = await reservar(await mesaLibre(), minutos(-60));
        expect(res.status).toBe(400);
    });

    test('sin cliente, mesa u hora responde 400', async () => {
        const res = await api.post('/reservas').send({ cliente_id: cliente.id });
        expect(res.status).toBe(400);
    });
});

describe('Cruces de horario (ventana_bloqueo)', () => {
    test('T9 · una segunda reserva de la misma mesa dentro de ventana_bloqueo se rechaza', async () => {
        const bloqueo = await config('ventana_bloqueo');
        const mesa = await mesaLibre();
        expect((await reservar(mesa, minutos(24 * 60))).status).toBe(201);
        const res = await reservar(mesa, minutos(24 * 60 + bloqueo - 10));
        expect(res.status).toBe(400);
        expect(await Reserva.count({ where: { mesa_id: mesa.id } })).toBe(1);
    });

    test('T9b · dos reservas de la misma mesa separadas por más que ventana_bloqueo se crean', async () => {
        const bloqueo = await config('ventana_bloqueo');
        const mesa = await mesaLibre();
        expect((await reservar(mesa, minutos(24 * 60))).status).toBe(201);
        expect((await reservar(mesa, minutos(24 * 60 + bloqueo + 10))).status).toBe(201);
    });

    test('la misma hora en otra mesa no se cruza', async () => {
        const hora = minutos(24 * 60);
        expect((await reservar(await mesaLibre(), hora)).status).toBe(201);
        expect((await reservar(await mesaLibre(), hora)).status).toBe(201);
    });

    test('cancelar una reserva libera el horario', async () => {
        const mesa = await mesaLibre();
        const hora = minutos(24 * 60);
        const primera = await reservar(mesa, hora);
        expect((await api.delete(`/reservas/${primera.body.id}`)).status).toBe(200);
        expect((await reservar(mesa, hora)).status).toBe(201);
    });
});

describe('T9c · editar una reserva', () => {
    test('cambiar el estado responde 200', async () => {
        const reserva = (await reservar(await mesaLibre(), minutos(24 * 60))).body;
        const res = await api.put(`/reservas/${reserva.id}`).send({ estado: 'CANCELADA' });
        expect(res.status).toBe(200);
        expect(res.body.data.estado).toBe('CANCELADA');
    });

    test.failing('mandar la misma mesa_id como texto, como lo hace el formulario, responde 200 (#50)', async () => {
        const mesa = await mesaLibre();
        const reserva = (await reservar(mesa, minutos(24 * 60))).body;
        const res = await api
            .put(`/reservas/${reserva.id}`)
            .send({ cliente_id: cliente.id, mesa_id: String(mesa.id), hora: reserva.hora });
        // hoy 500: la reserva choca consigo misma y "5" !== 5
        expect(res.status).toBe(200);
    });

    test('mandar la misma mesa_id como número responde 200', async () => {
        const mesa = await mesaLibre();
        const reserva = (await reservar(mesa, minutos(24 * 60))).body;
        const res = await api.put(`/reservas/${reserva.id}`).send({ mesa_id: mesa.id, hora: reserva.hora });
        expect(res.status).toBe(200);
    });

    test('una reserva pasada se puede marcar CANCELADA si no se reenvía la hora', async () => {
        const reserva = (await reservar(await mesaLibre(), minutos(24 * 60))).body;
        await moverHora(reserva.id, minutos(-5));
        const res = await api.put(`/reservas/${reserva.id}`).send({ estado: 'CANCELADA' });
        expect(res.status).toBe(200);
    });

    test('una reserva pasada se puede marcar LLEGO aunque el formulario reenvíe la misma hora', async () => {
        const mesa = await mesaLibre();
        const reserva = (await reservar(mesa, minutos(24 * 60))).body;
        const pasada = minutos(-5);
        await moverHora(reserva.id, pasada);
        const res = await api
            .put(`/reservas/${reserva.id}`)
            .send({ mesa_id: mesa.id, hora: pasada.toISOString(), estado: 'LLEGO' });
        // #50 temía que fallara la validación isFuture: no pasa, porque Sequelize solo valida
        // los campos que cambian y la hora es la misma
        expect(res.status).toBe(200);
    });
});

describe('Cancelar una reserva (RF-28)', () => {
    test.failing('DELETE deja la reserva en estado CANCELADA, no la borra (#50)', async () => {
        const reserva = (await reservar(await mesaLibre(), minutos(24 * 60))).body;
        expect((await api.delete(`/reservas/${reserva.id}`)).status).toBe(200);
        const guardada = await Reserva.findByPk(reserva.id); // hoy null: soft delete
        expect(guardada).toMatchObject({ estado: 'CANCELADA' });
    });
});

describe('R2 · llegada automática al abrir la orden (ventana_llegada)', () => {
    test('abrir una orden en una mesa con reserva dentro de ventana_llegada la marca LLEGO', async () => {
        const mesa = await mesaLibre();
        const reserva = (await reservar(mesa, minutos(15))).body;
        expect((await api.post('/ordenes').send({ mesa_id: mesa.id })).status).toBe(201);
        await expect(Reserva.findByPk(reserva.id)).resolves.toMatchObject({ estado: 'LLEGO' });
    });

    test('una reserva fuera de ventana_llegada sigue PENDIENTE', async () => {
        const llegada = await config('ventana_llegada');
        const mesa = await mesaLibre();
        const reserva = (await reservar(mesa, minutos(llegada + 30))).body;
        expect((await api.post('/ordenes').send({ mesa_id: mesa.id })).status).toBe(201);
        await expect(Reserva.findByPk(reserva.id)).resolves.toMatchObject({ estado: 'PENDIENTE' });
    });

    test('la mesa con una reserva dentro de ventana_llegada aparece reservada (estado 3) en GET /mesas', async () => {
        const mesa = await mesaLibre();
        expect((await reservar(mesa, minutos(15))).status).toBe(201);
        const mesas = (await api.get('/mesas')).body;
        expect(mesas.find((m) => m.id === mesa.id).estado).toBe(3);
    });
});

describe('R3 · reserva vencida (RN-02)', () => {
    async function reservaVencida(mesa) {
        const tolerancia = await config('minutos_tolerancia');
        const reserva = (await reservar(mesa, minutos(24 * 60))).body;
        await moverHora(reserva.id, minutos(-(tolerancia + 5)));
        return reserva;
    }

    test('pasada la tolerancia, la reserva pasa a EXPIRADA al listar las reservas', async () => {
        const reserva = await reservaVencida(await mesaLibre());
        const res = await api.get('/reservas');
        expect(res.status).toBe(200);
        expect(res.body.map((r) => r.id)).not.toContain(reserva.id);
        await expect(Reserva.findByPk(reserva.id)).resolves.toMatchObject({ estado: 'EXPIRADA' });
    });

    test('al vencer la reserva, la mesa reservada vuelve a libre al listar las mesas', async () => {
        const mesa = await mesaLibre();
        await mesa.update({ estado: 3 });
        const reserva = await reservaVencida(mesa);
        const mesas = (await api.get('/mesas')).body;
        expect(mesas.find((m) => m.id === mesa.id).estado).toBe(0);
        await expect(Reserva.findByPk(reserva.id)).resolves.toMatchObject({ estado: 'EXPIRADA' });
        await expect(Mesa.findByPk(mesa.id)).resolves.toMatchObject({ estado: 0 });
    });
});
