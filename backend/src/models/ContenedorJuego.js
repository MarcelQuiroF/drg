'use strict';
module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'ContenedorJuego',
        {
            hora_inicio: DataTypes.TIME,
            hora_fin: DataTypes.TIME,
            cantidad: { type: DataTypes.INTEGER, validate: { min: 1 } },
            comentario: DataTypes.STRING,
            // Precio cobrado por unidad, fijado al agregar el ítem (#22, ADR-007)
            precio_unitario: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                validate: { min: { args: [0], msg: 'El precio unitario no puede ser negativo' } }
            },
            orden_id: { type: DataTypes.INTEGER, allowNull: false },
            juego_id: { type: DataTypes.INTEGER, allowNull: false }
        },
        {
            tableName: 'contenedor_juego',
            paranoid: true
        }
    );
};
