'use strict';
module.exports = (sequelize, DataTypes) => {
    const ContenedorProducto = sequelize.define(
        'ContenedorProducto',
        {
            cantidad: { type: DataTypes.INTEGER, validate: { min: 1 } },

            cantidad_recibido: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
            cantidad_preparando: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
            cantidad_terminado: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
            cantidad_enviado: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },

            comentario: DataTypes.STRING,
            // Precio cobrado por unidad, fijado al agregar el ítem (#22, ADR-007)
            precio_unitario: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                validate: { min: { args: [0], msg: 'El precio unitario no puede ser negativo' } }
            },

            orden_id: { type: DataTypes.INTEGER, allowNull: false },
            producto_id: { type: DataTypes.INTEGER, allowNull: false }
        },
        {
            tableName: 'contenedor_producto',
            paranoid: true
        }
    );
    return ContenedorProducto;
};
