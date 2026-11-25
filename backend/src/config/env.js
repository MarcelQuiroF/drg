'use strict';

const path = require('path');

// Carga backend/.env sin importar desde qué carpeta se ejecute el proceso
// (npm start, sequelize-cli o un script suelto). Las variables que ya
// existen en el entorno tienen prioridad sobre las del archivo.
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env'), quiet: true });

const VARIABLES_OBLIGATORIAS = {
    DATABASE_URL: 'conexión a PostgreSQL (la usan las migraciones, el seed y la aplicación)',
    JWT_SECRET: 'clave para firmar los tokens de sesión'
};

// Detiene el arranque con un mensaje claro si falta una variable obligatoria,
// en lugar de fallar más tarde (por ejemplo, recién en el primer login).
function validarEntorno() {
    const faltantes = Object.keys(VARIABLES_OBLIGATORIAS).filter(
        (nombre) => !process.env[nombre] || !process.env[nombre].trim()
    );

    if (faltantes.length > 0) {
        const detalle = faltantes.map((nombre) => `  - ${nombre}: ${VARIABLES_OBLIGATORIAS[nombre]}`).join('\n');
        throw new Error(
            `Faltan variables de entorno obligatorias:\n${detalle}\n` +
                'Copia backend/.env.example a backend/.env y completa los valores.'
        );
    }

    if (process.env.DATABASE_URL2) {
        console.warn('Aviso: DATABASE_URL2 ya no se usa. La aplicación se conecta con DATABASE_URL.');
    }
}

module.exports = { validarEntorno, VARIABLES_OBLIGATORIAS };
