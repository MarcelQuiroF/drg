'use strict';
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const Empleado = sequelize.define('Empleado', {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: "El nombre es obligatorio" } }
    },
    ci: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: { msg: "Esta Cédula de Identidad (CI) ya está registrada" }
    },
    telefono: DataTypes.STRING,
    correo: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isEmail: { msg: "Debe ser un correo válido" } }
    },
    contrasenia: {
      type: DataTypes.STRING,
      allowNull: false
    },
    rol: {
      type: DataTypes.STRING,
      allowNull: false
    },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    tableName: 'empleado',
    paranoid: true,
    hooks: {
      beforeCreate: async (empleado) => {
        if (empleado.contrasenia) {
          const salt = await bcrypt.genSalt(10);
          empleado.contrasenia = await bcrypt.hash(empleado.contrasenia, salt);
        }
      },
      beforeUpdate: async (empleado) => {
        if (empleado.changed('contrasenia')) {
          const salt = await bcrypt.genSalt(10);
          empleado.contrasenia = await bcrypt.hash(empleado.contrasenia, salt);
        }
      }
    }
  });
  return Empleado;
};