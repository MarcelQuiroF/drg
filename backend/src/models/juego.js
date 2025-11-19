'use strict';
module.exports = (sequelize, DataTypes) => {
  const Juego = sequelize.define('Juego', {
    nombre: DataTypes.STRING(100),
    precio: DataTypes.DOUBLE,
    imagen: DataTypes.STRING(255),
    jugadores_min: DataTypes.INTEGER,
    jugadores_max: DataTypes.INTEGER,
    tiempo_partida: DataTypes.INTEGER
  }, {
    tableName: 'juego',
    paranoid: true
  });
  return Juego;
};
