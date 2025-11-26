'use strict';
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Mesa', {
    nombre: DataTypes.STRING,
    numero: DataTypes.INTEGER,
    estado: { type: DataTypes.INTEGER, defaultValue: 0 },
    piso_id: DataTypes.INTEGER
  }, {
    tableName: 'mesa',
    paranoid: true
  });
};