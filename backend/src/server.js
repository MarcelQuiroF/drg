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

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la base de datos exitosa.');

        app.listen(PORT, () => {
            console.log(`Servidor Express escuchando en http://localhost:${PORT}/api/v1`);
        });
    } catch (error) {
        console.error('Error al iniciar el servidor o conectar a la DB:', error.message);
        process.exit(1);
    }
}

startServer();
