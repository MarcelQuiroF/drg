'use strict';

// Corre antes de cada archivo de pruebas (setupFilesAfterEnv): cada archivo empieza con la
// base recién sembrada y no depende de lo que hicieron los demás.
const { sequelize } = require('../../src/models');
const { reiniciarDatos } = require('./baseDePruebas');

// La app escribe mensajes con console.log (en cada login) y console.error (cada controlador
// imprime el error antes de pasarlo a errorHandler). En las pruebas solo ensucian la salida:
// se silencian, salvo con MOSTRAR_LOGS=1. Los fallos de las pruebas los informa Jest igual.
if (!process.env.MOSTRAR_LOGS) {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
}

beforeAll(async () => {
    await reiniciarDatos(sequelize);
});

afterAll(async () => {
    await sequelize.close();
});
