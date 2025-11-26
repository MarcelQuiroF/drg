'use strict';
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('ContenedorJuego', {
    hora_inicio: DataTypes.TIME,
    hora_fin: DataTypes.TIME,
    cantidad: { type: DataTypes.INTEGER, validate: { min: 1 } },
    comentario: DataTypes.STRING,
    orden_id: { type: DataTypes.INTEGER, allowNull: false },
    juego_id: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    tableName: 'contenedor_juego',
    paranoid: true
  });
};