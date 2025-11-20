'use strict';

module.exports = (sequelize, DataTypes) => {
  const Producto = sequelize.define('Producto', {
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: { msg: "El nombre no puede estar vacío" } }
    },
    zona: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    precio: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    imagen: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'producto',
    paranoid: true,
    deletedAt: 'deletedAt',
    timestamps: true,
    hooks: {
      beforeCreate: (producto) => {
        console.log(`Creando producto: ${producto.nombre}`);
      },
      beforeUpdate: (producto) => {
        console.log(`Actualizando producto ID ${producto.id}`);
      },
      beforeDestroy: (producto) => {
        console.log(`Soft delete producto ID ${producto.id}`);
      }
    }
  });

  return Producto;
};
