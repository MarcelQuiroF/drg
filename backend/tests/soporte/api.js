'use strict';

// Ayudas para llamar a la API con Supertest, sin levantar el servidor en un puerto.
const request = require('supertest');
const app = require('../../src/app');

const API = '/api/v1';

// Usuarios que crea el seed (README → Primer ingreso). Son datos ficticios.
const USUARIOS = {
    ADMIN: { ci: '1234567LP', contrasenia: 'drg-desarrollo' },
    CAJERO: { ci: '2345678LP', contrasenia: 'drg-desarrollo' },
    MESERO: { ci: '3456789LP', contrasenia: 'drg-desarrollo' }
};

const tokens = {};

async function iniciarSesion(rol) {
    if (!tokens[rol]) {
        const res = await request(app).post(`${API}/auth/login`).send(USUARIOS[rol]);
        if (res.status !== 200 || !res.body.token) {
            throw new Error(`No se pudo iniciar sesión como ${rol}: ${res.status} ${JSON.stringify(res.body)}`);
        }
        tokens[rol] = res.body.token;
    }
    return tokens[rol];
}

// Devuelve un cliente con el token del rol ya puesto:
//   const api = await comoRol('MESERO');
//   const res = await api.get('/mesas');
async function comoRol(rol) {
    const token = await iniciarSesion(rol);
    const conToken = (metodo) => (ruta) =>
        request(app)[metodo](`${API}${ruta}`).set('Authorization', `Bearer ${token}`);
    return {
        get: conToken('get'),
        post: conToken('post'),
        put: conToken('put'),
        patch: conToken('patch'),
        delete: conToken('delete')
    };
}

// Sin sesión.
const anonimo = {
    get: (ruta) => request(app).get(`${API}${ruta}`),
    post: (ruta) => request(app).post(`${API}${ruta}`),
    put: (ruta) => request(app).put(`${API}${ruta}`),
    patch: (ruta) => request(app).patch(`${API}${ruta}`),
    delete: (ruta) => request(app).delete(`${API}${ruta}`)
};

module.exports = { app, API, USUARIOS, iniciarSesion, comoRol, anonimo };
