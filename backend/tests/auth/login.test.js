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

    test('T1 · un token con firma inválida responde 401 (#26)', async () => {
        const falso = jwt.sign({ id: 1, rol: 'ADMIN' }, 'otro-secreto');
        const res = await request(app).get(`${API}${rutaProtegida}`).set('Authorization', `Bearer ${falso}`);
        expect(res.status).toBe(401); // antes 403
        expect(res.body.message).toMatch(/inválido/);
        expect(res.headers['www-authenticate']).toBe('Bearer error="invalid_token"');
    });

    test('T1 · un token vencido responde 401 con "la sesión venció" (#26)', async () => {
        const vencido = jwt.sign({ id: 1, rol: 'ADMIN' }, process.env.JWT_SECRET, { expiresIn: -10 });
        const res = await request(app).get(`${API}${rutaProtegida}`).set('Authorization', `Bearer ${vencido}`);
        expect(res.status).toBe(401); // antes 403
        expect(res.body.message).toMatch(/venció/);
        expect(res.headers['www-authenticate']).toBe('Bearer error="invalid_token"');
    });

    test('T1 · un texto que no es un token y una cabecera sin "Bearer" responden 401 (#26)', async () => {
        const basura = await request(app).get(`${API}${rutaProtegida}`).set('Authorization', 'Bearer abc.def');
        expect(basura.status).toBe(401);
        const sinBearer = await request(app).get(`${API}${rutaProtegida}`).set('Authorization', 'Basic eDp5');
        expect(sinBearer.status).toBe(401);
        expect(sinBearer.headers['www-authenticate']).toBe('Bearer');
    });

    test('T1 · un rol sin permiso sigue respondiendo 403, no 401 (#26)', async () => {
        const mesero = await comoRol('MESERO');
        const res = await mesero.post('/productos').send({ nombre: 'No debería', precio: 1, zona: 'COCINA' });
        expect(res.status).toBe(403);
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

    test('T2b · un valor negativo se rechaza con 400 y no se guarda (#25)', async () => {
        const api = await comoRol('MESERO');
        const res = await api.put('/configuracion').send({
            configuraciones: [{ clave: 'ventana_bloqueo', valor: -30 }]
        });
        expect(res.status).toBe(400); // antes 200 y se guardaba -30
        const fila = await Configuracion.findOne({ where: { clave: 'ventana_bloqueo' } });
        expect(Number(fila.valor)).toBe(120);
    });

    test.each([
        ['un decimal', 2.5],
        ['un texto', 'mucho'],
        ['vacío', ''],
        ['null', null],
        ['un booleano', true]
    ])('T2b · %s no es un valor válido: 400 (#25)', async (_caso, valor) => {
        const api = await comoRol('CAJERO');
        const res = await api.put('/configuracion').send({ configuraciones: [{ clave: 'ventana_bloqueo', valor }] });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/entero/);
    });

    test('T2b · el número como texto (lo que mandan los <input>) se acepta (#25)', async () => {
        const api = await comoRol('MESERO');
        const res = await api
            .put('/configuracion')
            .send({ configuraciones: [{ clave: 'ventana_llegada', valor: '0' }] });
        expect(res.status).toBe(200);
        const fila = await Configuracion.findOne({ where: { clave: 'ventana_llegada' } });
        expect(Number(fila.valor)).toBe(0);
        await fila.update({ valor: 30 });
    });

    test('T2b · una clave que no existe se rechaza y no se crea (#25)', async () => {
        const api = await comoRol('MESERO');
        const res = await api
            .put('/configuracion')
            .send({ configuraciones: [{ clave: 'ventana_inventada', valor: 5 }] });
        expect(res.status).toBe(400); // antes 200 y se creaba la fila
        expect(await Configuracion.count({ where: { clave: 'ventana_inventada' } })).toBe(0);
    });

    test('T2b · si un valor es inválido no se guarda ninguno (todo o nada) (#25)', async () => {
        const api = await comoRol('MESERO');
        const res = await api.put('/configuracion').send({
            configuraciones: [
                { clave: 'minutos_tolerancia', valor: 15 },
                { clave: 'ventana_bloqueo', valor: -1 }
            ]
        });
        expect(res.status).toBe(400);
        const fila = await Configuracion.findOne({ where: { clave: 'minutos_tolerancia' } });
        expect(Number(fila.valor)).not.toBe(15);
    });

    test('T2b · sin la lista de configuraciones responde 400 (#25)', async () => {
        const api = await comoRol('MESERO');
        expect((await api.put('/configuracion').send({})).status).toBe(400);
        expect((await api.put('/configuracion').send({ configuraciones: [] })).status).toBe(400);
    });
});

describe('Pasos de la issue #25', () => {
    test('el MESERO no descarga las plantillas de importación (403) y sí ve la asistencia de hoy (200)', async () => {
        const mesero = await comoRol('MESERO');
        expect((await mesero.get('/importacion/plantillas/productos')).status).toBe(403); // antes 200 (T17)
        expect((await mesero.get('/asistencias/hoy')).status).toBe(200); // antes 403 (F5)
    });
});
