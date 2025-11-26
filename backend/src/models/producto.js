'use strict';
module.exports = (sequelize, DataTypes) => {
  const Producto = sequelize.define('Producto', {
    nombre: { type: DataTypes.STRING, allowNull: false },
    zona: DataTypes.STRING,
    activado: { type: DataTypes.BOOLEAN, defaultValue: true },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: { args: [0], msg: "El precio no puede ser negativo" }
      }
    },
    estado: { type: DataTypes.BOOLEAN, defaultValue: true },
    imagen: DataTypes.STRING
  }, {
    tableName: 'producto',
    paranoid: true
  });
  return Producto;
};