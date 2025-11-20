'use strict';

module.exports = (sequelize, DataTypes) => {
  const Mesa = sequelize.define('Mesa', {
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: { msg: "El nombre no puede estar vacío" } }
    },
    numero: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 }
    },
    casilla: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 }
    },
    estado: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0 // 0 = libre, 1 = ocupada, por ejemplo
    }
  }, {
    tableName: 'mesa',
    paranoid: true,
    deletedAt: 'deletedAt',
    timestamps: true,
    hooks: {
      beforeCreate: (mesa) => {
        console.log(`Creando mesa: ${mesa.nombre}`);
      },
      beforeUpdate: (mesa) => {
        console.log(`Actualizando mesa ID ${mesa.id}`);
      },
      beforeDestroy: (mesa) => {
        console.log(`Soft delete de mesa ID ${mesa.id}`);
      }
    }
  });

  return Mesa;
};
