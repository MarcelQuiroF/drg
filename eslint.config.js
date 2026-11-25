'use strict';

// Configuración de ESLint (formato "flat config", ESLint 9) para todo el repositorio.
// - backend/: Node.js con CommonJS (require / module.exports).
// - frontend/js/: navegador con módulos ES (import / export).
// - frontend/tests/: pruebas del frontend con el test runner de Node (módulos ES).
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

// XSS (#23): en el HTML que se arma para innerHTML, outerHTML o insertAdjacentHTML, cada ${…}
// tiene que ser escaparHTML(…) (de js/utils.js), Number(…), un literal, otra plantilla (que se
// revisa igual) o una variable cuyo nombre termine en HTML (HTML armado a propósito, ya escapado).
// Lo mismo con las concatenaciones con +. Si no, el dato se interpreta como código.
// Las variables …HTML también se revisan: así la convención no deja pasar datos sin escapar.
const destinoHTML =
    ':matches(AssignmentExpression[left.property.name=/^(innerHTML|outerHTML)$/], CallExpression[callee.property.name="insertAdjacentHTML"], VariableDeclarator[id.name=/HTML$/i], AssignmentExpression[left.name=/HTML$/i])';
const valorSeguro =
    'TemplateElement, Literal, TemplateLiteral, BinaryExpression, CallExpression[callee.name=/^(escaparHTML|Number)$/], Identifier[name=/HTML$/i]';
// Lo que ya está dentro de escaparHTML(…) o Number(…) no se vuelve a revisar.
const fueraDeLlamadaSegura = ':not(CallExpression[callee.name=/^(escaparHTML|Number)$/] *)';
const mensajeXSS =
    'Dato sin escapar en HTML (riesgo de XSS, #23): usa escaparHTML(…), Number(…) o una variable …HTML ya escapada.';
const reglasFrontend = {
    'no-restricted-syntax': [
        'error',
        {
            selector: `${destinoHTML} TemplateLiteral${fueraDeLlamadaSegura} > :not(${valorSeguro})`,
            message: mensajeXSS
        },
        {
            selector: `${destinoHTML} BinaryExpression[operator="+"]${fueraDeLlamadaSegura} > :not(${valorSeguro})`,
            message: mensajeXSS
        }
    ]
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
        rules: { ...reglasComunes, ...reglasFrontend }
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
        // Pruebas del frontend (#23): corren en Node con node:test, no en el navegador.
        files: ['frontend/tests/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: { ...globals.node }
        },
        rules: reglasComunes
    },
    prettier
];
