'use strict';

// Comprueba que la infraestructura deja la base como recién sembrada y que la API responde.
const request = require('supertest');
const { app, API, USUARIOS, comoRol, anonimo } = require('../soporte/api');
const { Empleado, Configuracion, Mesa, sequelize } = require('../../src/models');

describe('Base de pruebas', () => {
    test('se conecta a la base de DATABASE_URL_TEST, no a la de desarrollo', async () => {
        const [[{ base }]] = await sequelize.query('SELECT current_database() AS base');
        expect(base).toMatch(/_test$/);
        expect(sequelize.config.database).toBe(base);
    });

    test('tiene los tres usuarios del seed, uno por rol', async () => {
        const empleados = await Empleado.findAll({ attributes: ['ci', 'rol'], order: [['ci', 'ASC']] });
        expect(empleados.map((e) => [e.ci, e.rol])).toEqual([
            ['1234567LP', 'ADMIN'],
            ['2345678LP', 'CAJERO'],
            ['3456789LP', 'MESERO']
        ]);
    });

    test('tiene la configuración de reservas del seed', async () => {
        const filas = await Configuracion.findAll({ raw: true });
        const config = Object.fromEntries(filas.map((f) => [f.clave, Number(f.valor)]));
        expect(config).toMatchObject({ minutos_tolerancia: 30, ventana_bloqueo: 120 });
        expect(config).toHaveProperty('ventana_llegada');
    });

    test('los ids empiezan en 1 en cada archivo (TRUNCATE ... RESTART IDENTITY)', async () => {
        const primera = await Mesa.findOne({ order: [['id', 'ASC']] });
        expect(primera.id).toBe(1);
    });

    test('crear una fila nueva después del seed no choca con las secuencias (S2)', async () => {
        const api = await comoRol('ADMIN');
        const res = await api.post('/clientes').send({ nombre: 'Cliente creado en una prueba' });
        expect(res.status).toBe(201);
    });
});

describe('API', () => {
    test.each(Object.keys(USUARIOS))('inicia sesión como %s', async (rol) => {
        const res = await request(app).post(`${API}/auth/login`).send(USUARIOS[rol]);
        expect(res.status).toBe(200);
        expect(res.body.token).toEqual(expect.any(String));
    });

    test('una ruta de la API que no existe responde 404', async () => {
        const res = await anonimo.get('/no-existe');
        expect(res.status).toBe(404);
    });

    test('sirve el frontend estático', async () => {
        const res = await request(app).get('/html/login.html');
        expect(res.status).toBe(200);
        expect(res.text).toMatch(/<html/i);
    });
});
