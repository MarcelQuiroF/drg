'use strict';
module.exports = (sequelize, DataTypes) => {
  const Registro = sequelize.define('Registro', {
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    }
  }, {
    tableName: 'registro',
    paranoid: true
  });
  return Registro;
};