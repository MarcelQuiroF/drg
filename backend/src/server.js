const app = require('./app');
const sequelize = require('./models').sequelize;

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
































// logger.error('Error fatal al iniciar el servidor:', error);
// const logger = require('./config/logger'); // Si se usa