'use strict';
module.exports = (sequelize, DataTypes) => {
  const Categoria = sequelize.define('Categoria', {
    nombre: { type: DataTypes.STRING(100), allowNull: false }
  }, {
    tableName: 'categoria',
    paranoid: true
  });
  return Categoria;
};
