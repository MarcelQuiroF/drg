'use strict';
module.exports = (sequelize, DataTypes) => {
  const Juego = sequelize.define('Juego', {
    nombre: { type: DataTypes.STRING, allowNull: false },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      validate: { min: 0 }
    },
    jugadores_min: {
      type: DataTypes.INTEGER,
      validate: { min: 1 }
    },
    jugadores_max: {
      type: DataTypes.INTEGER,
      validate: { 
        min: 1,
        checkMax(value) {
          if (value < this.jugadores_min) {
            throw new Error('Jugadores max no puede ser menor que min');
          }
        }
      }
    },
    tiempo_partida: DataTypes.INTEGER,
    activado: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    tableName: 'juego',
    paranoid: true
  });
  return Juego;
};