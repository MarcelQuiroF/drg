'use strict';

// Configuración de ESLint (formato "flat config", ESLint 9) para todo el repositorio.
// - backend/: Node.js con CommonJS (require / module.exports).
// - frontend/js/: navegador con módulos ES (import / export), salvo catalogoCliente.js,
//   que se carga como script clásico en catalogo.html.
// El formato (sangría, comillas, punto y coma) lo decide Prettier; eslint-config-prettier
// apaga las reglas de ESLint que chocarían con él.

const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-config-prettier');

const reglasComunes = {
    // Variables sin usar: error, salvo los argumentos que empiezan con "_" y el "next"
    // de los middlewares de Express (la firma de 4 argumentos es obligatoria).
    // También se ignoran las variables que se separan con "...resto" para descartarlas.
    'no-unused-vars': ['error', { argsIgnorePattern: '^_|^next$', ignoreRestSiblings: true, caughtErrors: 'none' }],
    eqeqeq: ['error', 'smart'],
    'no-var': 'error',
    'prefer-const': 'error'
};

module.exports = [
    {
        ignores: ['**/node_modules/**', '**/coverage/**']
    },
    js.configs.recommended,
    {
        files: ['eslint.config.js', 'backend/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: { ...globals.node }
        },
        rules: reglasComunes
    },
    {
        files: ['frontend/js/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                // Chart.js se carga desde un CDN en indexAdmin.html (ADR-002 lo pasa a Vite).
                Chart: 'readonly'
            }
        },
        rules: reglasComunes
    },
    {
        // Pruebas automáticas (#18): Jest define describe, test, expect, etc.
        files: ['backend/tests/**/*.js', 'backend/jest.config.js'],
        languageOptions: {
            globals: { ...globals.jest }
        }
    },
    {
        // sequelize-cli llama a up/down con (queryInterface, Sequelize) aunque no se usen los dos.
        files: ['backend/src/migrations/**/*.js', 'backend/src/seeders/**/*.js'],
        rules: {
            'no-unused-vars': ['error', { args: 'none', ignoreRestSiblings: true }]
        }
    },
    {
        files: ['frontend/js/catalogoCliente.js'],
        languageOptions: { sourceType: 'script' }
    },
    prettier
];
