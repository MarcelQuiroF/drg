'use strict';
const { largoMaximo } = require('../utils/largoMaximo');

module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'Categoria',
        {
            nombre: { type: DataTypes.STRING(100), allowNull: false, validate: { ...largoMaximo(100, 'El nombre') } }
        },
        {
            tableName: 'categoria',
            paranoid: true
        }
    );
};
