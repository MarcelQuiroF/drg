'use strict';
module.exports = (sequelize, DataTypes) => {
  const Cliente = sequelize.define('Cliente', {
    nombre: DataTypes.STRING,
    ci: DataTypes.INTEGER,
    telefono: DataTypes.BIGINT
  }, {
    tableName: 'cliente',
    paranoid: true
  });
  return Cliente;
};
