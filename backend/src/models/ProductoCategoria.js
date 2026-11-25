'use strict';
module.exports = (sequelize, DataTypes) => {
    const ProductoCategoria = sequelize.define(
        'ProductoCategoria',
        {
            producto_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                references: { model: 'producto', key: 'id' }
            },
            categoria_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                references: { model: 'categoria', key: 'id' }
            }
        },
        {
            tableName: 'producto_categoria',
            // Sin borrado lógico: la clave primaria es (producto_id, categoria_id), así que una
            // relación borrada lógicamente impedía volver a asignar la misma categoría (#78).
            // El producto o juego y la categoría sí conservan su borrado lógico.
            paranoid: false,
            timestamps: true
        }
    );
    return ProductoCategoria;
};
