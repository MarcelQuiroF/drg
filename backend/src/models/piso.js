'use strict';

module.exports = (sequelize, DataTypes) => {
  const Piso = sequelize.define('Piso', {
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: { msg: "El nombre del piso no puede estar vacío" } }
    },
    numero: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 }
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'piso',
    paranoid: true,
    deletedAt: 'deletedAt',
    timestamps: true,
    hooks: {
      beforeCreate: (piso) => {
        console.log(`Creando piso: ${piso.nombre}`);
      },
      beforeUpdate: (piso) => {
        console.log(`Actualizando piso ID ${piso.id}`);
      },
      beforeDestroy: (piso) => {
        console.log(`Soft delete piso ID ${piso.id}`);
      }
    }
  });

  return Piso;
};
