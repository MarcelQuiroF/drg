'use strict';

// Corre una sola vez, antes de todas las pruebas: verifica que la base sea de pruebas,
// la crea si falta, borra el esquema y aplica las migraciones desde cero.
require('./entorno');
const { recrearEsquema } = require('./baseDePruebas');

module.exports = async () => {
    await recrearEsquema();
};
