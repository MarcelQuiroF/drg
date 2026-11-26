'use strict';
const { largoMaximo } = require('../utils/largoMaximo');
const { ZONAS_PRODUCTO, normalizarZona } = require('../config/zonasProducto');

module.exports = (sequelize, DataTypes) => {
    const Producto = sequelize.define(
        'Producto',
        {
            nombre: { type: DataTypes.STRING(100), allowNull: false, validate: { ...largoMaximo(100, 'El nombre') } },
            // Lista cerrada (#32): el CRUD y la importación pasan por aquí. Se guarda normalizada
            // ('Cocina' → 'COCINA') y cualquier otro valor responde 400. La base tiene el mismo CHECK.
            zona: {
                type: DataTypes.STRING(50),
                allowNull: false,
                set(valor) {
                    this.setDataValue('zona', normalizarZona(valor));
                },
                validate: {
                    notNull: { msg: `La zona es obligatoria (${ZONAS_PRODUCTO.join(' o ')}).` },
                    isIn: {
                        args: [ZONAS_PRODUCTO],
                        msg: `La zona tiene que ser ${ZONAS_PRODUCTO.join(' o ')}.`
                    }
                }
            },
            activado: { type: DataTypes.BOOLEAN, defaultValue: true },
            precio: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                validate: {
                    min: { args: [0], msg: 'El precio no puede ser negativo' }
                }
            },
            estado: { type: DataTypes.BOOLEAN, defaultValue: true },
            imagen: DataTypes.STRING
        },
        {
            tableName: 'producto',
            paranoid: true
        }
    );
    return Producto;
};
