'use strict';
module.exports = (sequelize, DataTypes) => {
  const Mesa = sequelize.define('Mesa', {
    nombre: DataTypes.STRING,
    numero: DataTypes.INTEGER,
    casilla: DataTypes.INTEGER,
    estado: DataTypes.INTEGER
  }, {
    tableName: 'mesa',
    paranoid: true
  });
  return Mesa;
};
