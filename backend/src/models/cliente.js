'use strict';
module.exports = (sequelize, DataTypes) => {
  const Cliente = sequelize.define('Cliente', {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true }
    },
    ci: { 
      type: DataTypes.STRING,
      allowNull: true,
      validate: { 
        customLen(value) {
          if (value && value.trim().length > 0) {
            if (value.length < 5 || value.length > 20) {
              throw new Error("El CI debe tener entre 5 y 20 caracteres");
            }
          }
        }
      }
    },
    telefono: DataTypes.STRING
  }, {
    tableName: 'cliente',
    paranoid: true
  });
  return Cliente;
};  