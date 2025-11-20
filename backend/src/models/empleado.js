'use strict';

module.exports = (sequelize, DataTypes) => {
  const Empleado = sequelize.define('Empleado', {
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: "El nombre no puede estar vacío" }
      }
    },
    ci: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    telefono: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    contrasenia: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    rol: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    direccion: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    correo: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: { isEmail: { msg: "Debe ser un correo válido" } }
    }
  }, {
    tableName: 'empleado',
    paranoid: true,
    deletedAt: 'deletedAt',
    timestamps: true,
    hooks: {
      beforeCreate: (empleado) => {
        console.log(`Creando empleado: ${empleado.nombre}`);
      },
      beforeUpdate: (empleado) => {
        console.log(`Actualizando empleado ID ${empleado.id}`);
      },
      beforeDestroy: (empleado) => {
        console.log(`Soft delete de empleado ID ${empleado.id}`);
      }
    }
  });

  return Empleado;
};
