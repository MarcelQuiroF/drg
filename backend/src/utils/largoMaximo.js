'use strict';

// Validación de largo para las columnas varchar(n) de los modelos (#28). Sequelize no la hace
// solo: con STRING(n), un texto más largo llega a PostgreSQL y vuelve como "Error en la base de
// datos" (500). Con esta validación responde 400 con un mensaje claro, antes de tocar la base.
//
//   telefono: { type: DataTypes.STRING(20), validate: { ...largoMaximo(20, 'El teléfono') } }
function largoMaximo(n, campo) {
    return { len: { args: [0, n], msg: `${campo} puede tener como máximo ${n} caracteres.` } };
}

module.exports = { largoMaximo };
