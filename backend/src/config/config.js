'use strict';

// Configuración que leen sequelize-cli (migraciones y seed) y la aplicación
// (models/index.js). Desarrollo y producción usan DATABASE_URL; las pruebas, DATABASE_URL_TEST.
require('./env');

const base = {
    url: process.env.DATABASE_URL,
    dialect: 'postgres'
};

module.exports = {
    development: { ...base },
    // Las pruebas automáticas (#18) usan su propia base y nunca DATABASE_URL:
    // tests/soporte/baseDePruebas.js se niega a correr si las dos apuntan a la misma.
    test: { ...base, url: process.env.DATABASE_URL_TEST, logging: false },
    production: { ...base }
};
