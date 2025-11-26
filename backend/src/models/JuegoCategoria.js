'use strict';
module.exports = (sequelize, DataTypes) => {
  const JuegoCategoria = sequelize.define('JuegoCategoria', {
    juego_id: {
      type: DataTypes.INTEGER,
      references: { model: 'juego', key: 'id' }
    },
    categoria_id: {
      type: DataTypes.INTEGER,
      references: { model: 'categoria', key: 'id' }
    }
  }, {
    tableName: 'juego_categoria',
    paranoid: true,
    timestamps: true
  });
  return JuegoCategoria;
};