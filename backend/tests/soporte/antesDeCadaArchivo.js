'use strict';

// Corre antes de cada archivo de pruebas (setupFilesAfterEnv): cada archivo empieza con la
// base recién sembrada y no depende de lo que hicieron los demás.
const { sequelize } = require('../../src/models');
const { reiniciarDatos } = require('./baseDePruebas');

// La app escribe mensajes con console.log (por ejemplo, en cada login). En las pruebas solo
// ensucian la salida: se silencian, salvo con MOSTRAR_LOGS=1. Los avisos y errores se ven siempre.
if (!process.env.MOSTRAR_LOGS) {
    jest.spyOn(console, 'log').mockImplementation(() => {});
}

beforeAll(async () => {
    await reiniciarDatos(sequelize);
});

afterAll(async () => {
    await sequelize.close();
});
