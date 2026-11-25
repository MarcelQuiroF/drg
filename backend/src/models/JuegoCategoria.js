'use strict';
module.exports = (sequelize, DataTypes) => {
    const JuegoCategoria = sequelize.define(
        'JuegoCategoria',
        {
            juego_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                references: { model: 'juego', key: 'id' }
            },
            categoria_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                references: { model: 'categoria', key: 'id' }
            }
        },
        {
            tableName: 'juego_categoria',
            // Sin borrado lógico: la clave primaria es (juego_id, categoria_id), así que una
            // relación borrada lógicamente impedía volver a asignar la misma categoría (#78).
            // El producto o juego y la categoría sí conservan su borrado lógico.
            paranoid: false,
            timestamps: true
        }
    );
    return JuegoCategoria;
};
