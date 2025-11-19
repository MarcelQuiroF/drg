'use strict';
module.exports = (sequelize, DataTypes) => {
  const Producto = sequelize.define('Producto', {
    nombre: DataTypes.STRING(100),
    zona: DataTypes.STRING(50),
    precio: DataTypes.DOUBLE,
    estado: DataTypes.BOOLEAN,
    imagen: DataTypes.STRING(255)
  }, {
    tableName: 'producto',
    paranoid: true
  });
  return Producto;
};
