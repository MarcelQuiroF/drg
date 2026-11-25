'use strict';
const { largoMaximo } = require('../utils/largoMaximo');

module.exports = (sequelize, DataTypes) => {
    const Cliente = sequelize.define(
        'Cliente',
        {
            nombre: {
                type: DataTypes.STRING(100),
                allowNull: false,
                validate: { notEmpty: true, ...largoMaximo(100, 'El nombre') }
            },
            ci: {
                type: DataTypes.STRING(20),
                allowNull: true,
                validate: {
                    customLen(value) {
                        if (value && value.trim().length > 0) {
                            if (value.length < 5 || value.length > 20) {
                                throw new Error('El CI debe tener entre 5 y 20 caracteres');
                            }
                        }
                    }
                }
            },
            // varchar(20) en la base: un teléfono más largo daba 500 (#28)
            telefono: { type: DataTypes.STRING(20), validate: { ...largoMaximo(20, 'El teléfono') } }
        },
        {
            tableName: 'cliente',
            paranoid: true
        }
    );
    return Cliente;
};
