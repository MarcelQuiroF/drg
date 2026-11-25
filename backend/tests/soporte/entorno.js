'use strict';

// Se carga antes que cualquier otro módulo, en globalSetup y en cada archivo de pruebas.
// Fija un entorno igual en todas las máquinas (también en el CI de #19).

// Las pruebas arrancan en UTC, como el CI y como un servidor sin configurar. La aplicación
// tiene que poner sola la zona del negocio (America/La_Paz) al cargar config/env.js (#27): si
// no lo hiciera, las pruebas de zona horaria fallarían. Por eso va ANTES del require.
process.env.TZ = 'UTC';

// backend/.env puede traer DATABASE_URL_TEST; las variables del sistema tienen prioridad.
require('../../src/config/env');

// Jest ya pone NODE_ENV=test; se fija igual por si se ejecuta de otra forma.
process.env.NODE_ENV = 'test';

// Valores solo para pruebas: no hace falta definirlos en .env.
process.env.JWT_SECRET = process.env.JWT_SECRET_TEST || 'secreto-solo-para-pruebas';
process.env.JWT_EXPIRATION = '1h';
