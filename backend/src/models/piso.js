'use strict';
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Piso', {
    nombre: DataTypes.STRING,
    numero: DataTypes.INTEGER,
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    tableName: 'piso',
    paranoid: true
  });
};