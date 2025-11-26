'use strict';
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Categoria', {
    nombre: { type: DataTypes.STRING, allowNull: false }
  }, {
    tableName: 'categoria',
    paranoid: true
  });
};