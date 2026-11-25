'use strict';

// Configuración que leen sequelize-cli (migraciones y seed) y la aplicación
// (models/index.js). Desarrollo y producción usan DATABASE_URL; las pruebas, DATABASE_URL_TEST.
const { ZONA_HORARIA } = require('./env');

const base = {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    // Zona de la conexión (#27): Sequelize manda los Date con el desfase de Bolivia (-04:00) y
    // PostgreSQL usa esa zona en now(), CURRENT_DATE y al convertir un Date a una columna `time`.
    // Las columnas timestamptz guardan el instante igual con cualquier zona.
    timezone: ZONA_HORARIA
};

module.exports = {
    development: { ...base },
    // Las pruebas automáticas (#18) usan su propia base y nunca DATABASE_URL:
    // tests/soporte/baseDePruebas.js se niega a correr si las dos apuntan a la misma.
    test: { ...base, url: process.env.DATABASE_URL_TEST, logging: false },
    production: { ...base }
};
