'use strict';

// Configuración de Jest. Plan de pruebas: docs/05_pruebas/plan-de-pruebas.md
module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.js'],
    setupFiles: ['<rootDir>/tests/soporte/entorno.js'],
    globalSetup: '<rootDir>/tests/soporte/globalSetup.js',
    setupFilesAfterEnv: ['<rootDir>/tests/soporte/antesDeCadaArchivo.js'],
    // En serie: todos los archivos comparten una sola base de pruebas (ver el plan).
    maxWorkers: 1,
    testTimeout: 20000,
    collectCoverageFrom: ['src/**/*.js', '!src/migrations/**', '!src/seeders/**', '!src/server.js'],
    coverageDirectory: '<rootDir>/coverage'
};
