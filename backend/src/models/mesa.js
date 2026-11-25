'use strict';
const { largoMaximo } = require('../utils/largoMaximo');

module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'Mesa',
        {
            // NOT NULL en la base: sin nombre, crear una mesa daba 500 (T4, #28)
            nombre: {
                type: DataTypes.STRING(100),
                allowNull: false,
                validate: {
                    notNull: { msg: 'El nombre de la mesa es obligatorio.' },
                    notEmpty: { msg: 'El nombre de la mesa es obligatorio.' },
                    ...largoMaximo(100, 'El nombre')
                }
            },
            numero: {
                type: DataTypes.INTEGER,
                allowNull: false,
                validate: { notNull: { msg: 'El número de la mesa es obligatorio.' } }
            },
            estado: { type: DataTypes.INTEGER, defaultValue: 0 },
            piso_id: DataTypes.INTEGER,
            cantidadMinima: {
                type: DataTypes.INTEGER,
                defaultValue: 1,
                validate: { min: 1 }
            },
            cantidadMaxima: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 4,
                validate: {
                    min: 1,
                    isGreaterThanMin(value) {
                        if (value < this.cantidadMinima) {
                            throw new Error('La capacidad máxima no puede ser menor a la mínima.');
                        }
                    }
                }
            },
            activo: { type: DataTypes.BOOLEAN, defaultValue: true }
        },
        {
            tableName: 'mesa',
            paranoid: true
        }
    );
};
