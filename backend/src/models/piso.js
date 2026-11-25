'use strict';
const { largoMaximo } = require('../utils/largoMaximo');

module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'Piso',
        {
            nombre: { type: DataTypes.STRING(100), allowNull: false, validate: { ...largoMaximo(100, 'El nombre') } },
            numero: DataTypes.INTEGER,
            activo: { type: DataTypes.BOOLEAN, defaultValue: true }
        },
        {
            tableName: 'piso',
            paranoid: true
        }
    );
};
