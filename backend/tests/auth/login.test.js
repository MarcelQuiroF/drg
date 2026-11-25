'use strict';

// Inicio de sesión, token y configuración por rol (casos T1, T2 y T2b del análisis).
const jwt = require('jsonwebtoken');
const { anonimo, comoRol, USUARIOS, iniciarSesion, API, app } = require('../soporte/api');
const request = require('supertest');
const { Empleado, Configuracion } = require('../../src/models');

describe('Inicio de sesión', () => {
    test('con CI y contraseña correctos devuelve un token y los datos del empleado, sin la contraseña', async () => {
        const res = await anonimo.post('/auth/login').send(USUARIOS.CAJERO);
        expect(res.status).toBe(200);
        expect(res.body.token).toEqual(expect.any(String));
        expect(res.body.empleado).toMatchObject({ ci: '2345678LP', rol: 'CAJERO' });
        expect(res.body.empleado).not.toHaveProperty('contrasenia');
    });

    test('el token lleva el id y el rol del empleado', async () => {
        const token = await iniciarSesion('MESERO');
        expect(jwt.decode(token)).toMatchObject({ rol: 'MESERO', id: expect.any(Number) });
    });

    test('con contraseña incorrecta responde 401', async () => {
        const res = await anonimo.post('/auth/login').send({ ci: '1234567LP', contrasenia: 'otra' });
        expect(res.status).toBe(401);
        expect(res.body).not.toHaveProperty('token');
    });

    test('con un CI que no existe responde 401', async () => {
        const res = await anonimo.post('/auth/login').send({ ci: '0000000LP', contrasenia: 'drg-desarrollo' });
        expect(res.status).toBe(401);
    });

    test('sin CI o sin contraseña responde 400', async () => {
        expect((await anonimo.post('/auth/login').send({ ci: '1234567LP' })).status).toBe(400);
        expect((await anonimo.post('/auth/login').send({ contrasenia: 'x' })).status).toBe(400);
    });

    test('un empleado desactivado no puede iniciar sesión (401)', async () => {
        const empleado = await Empleado.findOne({ where: { ci: '3456789LP' } });
        await empleado.update({ activo: false });
        try {
            const res = await anonimo.post('/auth/login').send(USUARIOS.MESERO);
            expect(res.status).toBe(401);
        } finally {
            await empleado.update({ activo: true });
        }
    });
});

describe('Token', () => {
    const rutaProtegida = '/mesas';

    test('sin token, una ruta protegida responde 401', async () => {
        const res = await anonimo.get(rutaProtegida);
        expect(res.status).toBe(401);
    });

    test('con el token del login, la ruta responde 200', async () => {
        const api = await comoRol('MESERO');
        expect((await api.get(rutaProtegida)).status).toBe(200);
    });

    test.failing('T1 · un token con firma inválida responde 401 (#26)', async () => {
        const falso = jwt.sign({ id: 1, rol: 'ADMIN' }, 'otro-secreto');
        const res = await request(app).get(`${API}${rutaProtegida}`).set('Authorization', `Bearer ${falso}`);
        expect(res.status).toBe(401); // hoy 403
    });

    test.failing('T1 · un token vencido responde 401 (#26)', async () => {
        const vencido = jwt.sign({ id: 1, rol: 'ADMIN' }, process.env.JWT_SECRET, { expiresIn: -10 });
        const res = await request(app).get(`${API}${rutaProtegida}`).set('Authorization', `Bearer ${vencido}`);
        expect(res.status).toBe(401); // hoy 403
    });
});

describe('Configuración de reservas', () => {
    test('T2 · por RN-16, el MESERO puede cambiar la configuración (200)', async () => {
        const api = await comoRol('MESERO');
        const res = await api.put('/configuracion').send({
            configuraciones: [{ clave: 'minutos_tolerancia', valor: 45 }]
        });
        expect(res.status).toBe(200);
        const fila = await Configuracion.findOne({ where: { clave: 'minutos_tolerancia' } });
        expect(Number(fila.valor)).toBe(45);
    });

    test.failing('T2b · un valor negativo se rechaza con 400 y no se guarda (#25)', async () => {
        const api = await comoRol('MESERO');
        const res = await api.put('/configuracion').send({
            configuraciones: [{ clave: 'ventana_bloqueo', valor: -30 }]
        });
        expect(res.status).toBe(400); // hoy 200 y se guarda -30
        const fila = await Configuracion.findOne({ where: { clave: 'ventana_bloqueo' } });
        expect(Number(fila.valor)).toBe(120);
    });
});
