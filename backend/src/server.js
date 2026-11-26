'use strict';

// Primero el entorno: el resto de los módulos lee process.env al cargarse.
const { validarEntorno } = require('./config/env');

try {
    validarEntorno();
} catch (error) {
    console.error(error.message);
    process.exit(1);
}

const app = require('./app');
const { sequelize } = require('./models');
const { escuchar } = require('./utils/escuchar');

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la base de datos exitosa.');

        // Si el puerto está ocupado, escuchar() rechaza con un mensaje claro (#110)
        await escuchar(app, PORT);
        console.log(`Servidor Express escuchando en http://localhost:${PORT}/api/v1`);
    } catch (error) {
        console.error('Error al iniciar el servidor:', error.message);
        // Se cierra la conexión con la base para que el proceso termine ya, con código distinto de 0
        await sequelize.close().catch(() => {});
        process.exit(1);
    }
}

startServer();
