'use strict';
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Horario', {
    dia: DataTypes.STRING,
    hora_entrada: DataTypes.TIME,
    hora_salida: DataTypes.TIME,
    registro: DataTypes.DATE
  }, {
    tableName: 'horario',
    paranoid: true
  });
};