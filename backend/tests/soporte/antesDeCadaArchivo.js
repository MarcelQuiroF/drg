'use strict';

// Corre antes de cada archivo de pruebas (setupFilesAfterEnv): cada archivo empieza con la
// base recién sembrada y no depende de lo que hicieron los demás.
const { sequelize } = require('../../src/models');
const { reiniciarDatos } = require('./baseDePruebas');

beforeAll(async () => {
    await reiniciarDatos(sequelize);
});

afterAll(async () => {
    await sequelize.close();
});
