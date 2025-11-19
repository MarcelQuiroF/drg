'use strict';
module.exports = (sequelize, DataTypes) => {
  const Piso = sequelize.define('Piso', {
    nombre: DataTypes.STRING,
    numero: DataTypes.INTEGER,
    activo: DataTypes.BOOLEAN
  }, {
    tableName: 'piso',
    paranoid: true
  });
  return Piso;
};
