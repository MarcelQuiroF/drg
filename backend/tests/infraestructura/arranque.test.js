'use strict';

// Arranque con el puerto ocupado (#110): el servidor tiene que decirlo y terminar con código ≠ 0.
// Antes mostraba "Servidor Express escuchando…" y quedaba vivo sin atender nada.
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');
const express = require('express');
const { escuchar, mensajeDeError } = require('../../src/utils/escuchar');

// Un puerto libre ocupado por otro servidor (como un segundo "npm start")
function ocuparUnPuerto() {
    return new Promise((resolve) => {
        const ocupante = net.createServer();
        ocupante.listen(0, '127.0.0.1', () => resolve(ocupante));
    });
}

let ocupante;
let puerto;

beforeAll(async () => {
    ocupante = await ocuparUnPuerto();
    puerto = ocupante.address().port;
});

afterAll(() => new Promise((resolve) => ocupante.close(resolve)));

describe('escuchar()', () => {
    test('con el puerto ocupado rechaza con un mensaje claro', async () => {
        await expect(escuchar(express(), puerto)).rejects.toMatchObject({
            code: 'EADDRINUSE',
            message: expect.stringMatching(new RegExp(`puerto ${puerto} ya está en uso.*PORT`))
        });
    });

    test('con un puerto libre resuelve con el servidor escuchando', async () => {
        const servidor = await escuchar(express(), 0);
        expect(servidor.listening).toBe(true);
        await new Promise((resolve) => servidor.close(resolve));
    });

    test('un puerto sin permiso tiene su propio mensaje', () => {
        expect(mensajeDeError({ code: 'EACCES' }, 80)).toMatch(/permiso para usar el puerto 80/);
    });
});

describe('npm start (src/server.js) con el puerto ocupado', () => {
    test('muestra el error, no dice "escuchando" y termina con código distinto de 0', async () => {
        const hijo = spawn(process.execPath, [path.join(__dirname, '../../src/server.js')], {
            env: {
                ...process.env,
                NODE_ENV: 'development',
                // La base de pruebas: el servidor solo se conecta para comprobar que existe
                DATABASE_URL: process.env.DATABASE_URL_TEST,
                JWT_SECRET: 'arranque-110',
                PORT: String(puerto)
            }
        });
        let salida = '';
        hijo.stdout.on('data', (d) => (salida += d));
        hijo.stderr.on('data', (d) => (salida += d));

        const codigo = await new Promise((resolve) => {
            const reloj = setTimeout(() => {
                hijo.kill(); // antes de #110 el proceso no terminaba nunca
                resolve('sigue vivo');
            }, 15000);
            hijo.on('exit', (c) => {
                clearTimeout(reloj);
                resolve(c);
            });
        });

        expect(codigo).toBe(1);
        expect(salida).toMatch(`El puerto ${puerto} ya está en uso`);
        expect(salida).not.toMatch(/escuchando/);
    }, 20000);
});
