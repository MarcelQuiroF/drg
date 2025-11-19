'use strict';
module.exports = (sequelize, DataTypes) => {
  const Registro = sequelize.define('Registro', {
    fecha: DataTypes.DATE
  }, {
    tableName: 'registro',
    paranoid: true
  });
  return Registro;
};
