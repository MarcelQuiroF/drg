'use strict';

// Configuración que leen sequelize-cli (migraciones y seed) y la aplicación
// (models/index.js). Todos los entornos usan la misma variable DATABASE_URL.
require('./env');

const base = {
    url: process.env.DATABASE_URL,
    dialect: 'postgres'
};

module.exports = {
    development: { ...base },
    test: { ...base },
    production: { ...base }
};
