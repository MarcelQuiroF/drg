'use strict';

// Todo lo que toca la base de pruebas pasa por este archivo.
// Antes de borrar algo se llama a verificarBaseDePruebas(): si la conexión no es
// claramente una base de pruebas, se detiene todo y no se toca nada.

const { execFileSync } = require('child_process');
const path = require('path');
const { Sequelize } = require('sequelize');

const RAIZ_BACKEND = path.join(__dirname, '..', '..');

// Las partes de una URL de PostgreSQL que identifican a la base (sin usuario ni contraseña).
function identificarBase(url) {
    const u = new URL(url);
    const servidor = u.hostname === '127.0.0.1' || u.hostname === '::1' ? 'localhost' : u.hostname;
    return {
        servidor,
        puerto: u.port || '5432',
        nombre: decodeURIComponent(u.pathname.replace(/^\//, ''))
    };
}

// Devuelve la lista de motivos por los que NO se puede usar la base (vacía = se puede).
// Es una función pura para poder probarla sin conexión.
function motivosParaRechazar({ urlPruebas, urlDesarrollo, nodeEnv }) {
    const motivos = [];

    if (nodeEnv !== 'test') {
        motivos.push(`NODE_ENV tiene que ser "test" (es "${nodeEnv || ''}").`);
    }
    if (!urlPruebas || !urlPruebas.trim()) {
        motivos.push('Falta DATABASE_URL_TEST (ver backend/.env.example).');
        return motivos;
    }

    let pruebas;
    try {
        pruebas = identificarBase(urlPruebas);
    } catch {
        motivos.push('DATABASE_URL_TEST no es una URL válida (postgres://usuario:contraseña@servidor:puerto/base).');
        return motivos;
    }

    if (!pruebas.nombre.endsWith('_test')) {
        motivos.push(`El nombre de la base de pruebas tiene que terminar en "_test" (es "${pruebas.nombre}").`);
    }

    if (urlDesarrollo) {
        try {
            const desarrollo = identificarBase(urlDesarrollo);
            if (
                desarrollo.servidor === pruebas.servidor &&
                desarrollo.puerto === pruebas.puerto &&
                desarrollo.nombre === pruebas.nombre
            ) {
                motivos.push('DATABASE_URL_TEST apunta a la misma base que DATABASE_URL.');
            }
        } catch {
            // Una DATABASE_URL mal escrita no impide las pruebas: no es la misma base.
        }
    }

    return motivos;
}

function verificarBaseDePruebas() {
    const motivos = motivosParaRechazar({
        urlPruebas: process.env.DATABASE_URL_TEST,
        urlDesarrollo: process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV
    });
    if (motivos.length > 0) {
        throw new Error(
            'Las pruebas se detuvieron para no tocar una base que no es de pruebas:\n' +
                motivos.map((m) => `  - ${m}`).join('\n')
        );
    }
}

// Crea la base si no existe (conectándose a la base "postgres" del mismo servidor).
async function crearBaseSiFalta() {
    const url = new URL(process.env.DATABASE_URL_TEST);
    const nombre = decodeURIComponent(url.pathname.replace(/^\//, ''));
    const prueba = new Sequelize(url.toString(), { logging: false });
    try {
        await prueba.authenticate();
        return;
    } catch (error) {
        if (error.original?.code !== '3D000') throw error; // 3D000: la base no existe
    } finally {
        await prueba.close();
    }
    url.pathname = '/postgres';
    const admin = new Sequelize(url.toString(), { logging: false });
    try {
        await admin.query(`CREATE DATABASE "${nombre.replace(/"/g, '""')}"`);
    } finally {
        await admin.close();
    }
}

// Borra todo el esquema y corre las migraciones desde cero. Una vez por corrida (globalSetup):
// así cada corrida prueba también que las migraciones funcionan en una base vacía.
async function recrearEsquema() {
    verificarBaseDePruebas();
    await crearBaseSiFalta();
    const conexion = new Sequelize(process.env.DATABASE_URL_TEST, { logging: false });
    try {
        await conexion.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    } finally {
        await conexion.close();
    }
    execFileSync(process.execPath, [require.resolve('sequelize-cli/lib/sequelize'), 'db:migrate', '--env', 'test'], {
        cwd: RAIZ_BACKEND,
        env: process.env,
        stdio: 'pipe'
    });
}

// Deja la base como recién sembrada: vacía todas las tablas (menos el registro de
// migraciones), reinicia los contadores de id y vuelve a correr el seed.
// Se llama antes de cada archivo de pruebas.
async function reiniciarDatos(sequelize) {
    verificarBaseDePruebas();
    const [tablas] = await sequelize.query(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'SequelizeMeta'"
    );
    if (tablas.length > 0) {
        const lista = tablas.map((t) => `"${t.tablename}"`).join(', ');
        await sequelize.query(`TRUNCATE ${lista} RESTART IDENTITY CASCADE`);
    }
    const seed = require('../../src/seeders/20251120000000-master-seed');
    await seed.up(sequelize.getQueryInterface(), Sequelize);
    await abrirDiaDePrueba(sequelize);
}

// Desde #34 no se toman órdenes ni se cobra con el día cerrado. Cada archivo empieza con el día de
// hoy (en Bolivia) abierto por el cajero del seed, como en el local después de abrir. Las pruebas de
// la apertura y el cierre (tests/jornada/) lo cierran o lo borran ellas mismas.
async function abrirDiaDePrueba(sequelize) {
    await sequelize.query(
        `INSERT INTO jornada (fecha, abierta_por, abierta_en, "createdAt", "updatedAt")
         SELECT (now() AT TIME ZONE 'America/La_Paz')::date, id, now(), now(), now()
         FROM empleado WHERE ci = '2345678LP'`
    );
}

module.exports = {
    motivosParaRechazar,
    verificarBaseDePruebas,
    recrearEsquema,
    reiniciarDatos,
    abrirDiaDePrueba
};
