'use strict';

module.exports = (sequelize, DataTypes) => {
  const Cliente = sequelize.define('Cliente', {
    nombre: { 
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: "El nombre no puede estar vacío" }
      }
    },
    ci: { 
      type: DataTypes.INTEGER,
      allowNull: true
    },
    telefono: { 
      type: DataTypes.BIGINT,
      allowNull: true
    }
  }, {
    tableName: 'cliente',
    paranoid: true,
    timestamps: true,
    underscored: true,

    hooks: {
      beforeCreate: (cliente) => {
        console.log("Cliente se crea:", cliente.nombre);
      },
      beforeUpdate: (cliente) => {
        console.log("Cliente se actualiza:", cliente.nombre);
      },
      beforeDestroy: (cliente) => {
        console.log("Soft delete sobre cliente:", cliente.nombre);
      }
    }
  });

  return Cliente;
};
