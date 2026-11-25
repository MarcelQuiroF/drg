'use strict';

// Se carga antes que cualquier otro módulo, en globalSetup y en cada archivo de pruebas.
// Fija un entorno igual en todas las máquinas (también en el CI de #19).

// backend/.env puede traer DATABASE_URL_TEST; las variables del sistema tienen prioridad.
require('../../src/config/env');

// Jest ya pone NODE_ENV=test; se fija igual por si se ejecuta de otra forma.
process.env.NODE_ENV = 'test';

// El local está en Bolivia (UTC-4). Con la zona fija, las pruebas dan lo mismo en una PC
// del local que en el CI (que corre en UTC) y los bugs de zona horaria (#27) se ven igual.
process.env.TZ = 'America/La_Paz';

// Valores solo para pruebas: no hace falta definirlos en .env.
process.env.JWT_SECRET = process.env.JWT_SECRET_TEST || 'secreto-solo-para-pruebas';
process.env.JWT_EXPIRATION = '1h';
