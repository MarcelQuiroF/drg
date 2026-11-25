'use strict';

// npm run db:preparar (#20): deja la base de DATABASE_URL lista para usar.
//   1. Crea la base si no existe (no hace falta psql ni pgAdmin para eso).
//   2. Aplica las migraciones pendientes (sequelize-cli db:migrate).
//   3. Carga el seed de desarrollo solo si la base todavía no tiene empleados.
// Se puede correr varias veces: después de un "git pull" aplica las migraciones nuevas
// y no vuelve a cargar el seed sobre datos que ya existen.

const { execFileSync } = require('child_process');
const path = require('path');
const { Sequelize } = require('sequelize');

require('../src/config/env');

const RAIZ_BACKEND = path.join(__dirname, '..');
const SEQUELIZE_CLI = require.resolve('sequelize-cli/lib/sequelize');

function correrSequelizeCli(comando) {
    execFileSync(process.execPath, [SEQUELIZE_CLI, comando], { cwd: RAIZ_BACKEND, env: process.env, stdio: 'inherit' });
}

// Se conecta a la base; si no existe (código 3D000), la crea desde la base "postgres" del servidor.
async function crearBaseSiFalta(urlTexto) {
    const url = new URL(urlTexto);
    const nombre = decodeURIComponent(url.pathname.replace(/^\//, ''));
    const conexion = new Sequelize(url.toString(), { logging: false });
    try {
        await conexion.authenticate();
        console.log(`La base "${nombre}" ya existe.`);
        return;
    } catch (error) {
        if (error.original?.code !== '3D000') throw error;
    } finally {
        await conexion.close();
    }
    url.pathname = '/postgres';
    const admin = new Sequelize(url.toString(), { logging: false });
    try {
        await admin.query(`CREATE DATABASE "${nombre.replace(/"/g, '""')}"`);
        console.log(`Base "${nombre}" creada.`);
    } finally {
        await admin.close();
    }
}

async function contarEmpleados(urlTexto) {
    const conexion = new Sequelize(urlTexto, { logging: false });
    try {
        const [[fila]] = await conexion.query('SELECT COUNT(*)::int AS total FROM empleado');
        return fila.total;
    } finally {
        await conexion.close();
    }
}

async function main() {
    const url = process.env.DATABASE_URL;
    if (!url || !url.trim()) {
        throw new Error('Falta DATABASE_URL. Copia backend/.env.example a backend/.env y completa los valores.');
    }

    await crearBaseSiFalta(url);

    console.log('Aplicando migraciones...');
    correrSequelizeCli('db:migrate');

    const empleados = await contarEmpleados(url);
    if (empleados > 0) {
        console.log(`La base ya tiene datos (${empleados} empleados): no se vuelve a cargar el seed.`);
    } else {
        console.log('Cargando el seed de desarrollo...');
        correrSequelizeCli('db:seed:all');
    }

    console.log('Base lista. Siguiente paso: npm start');
}

main().catch((error) => {
    console.error(`No se pudo preparar la base: ${error.message}`);
    process.exit(1);
});
