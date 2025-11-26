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
      validate: { 
        len: { args: [5, 20], msg: "El CI debe tener entre 5 y 20 caracteres" } 
      }
    },
    telefono: DataTypes.STRING
  }, {
    tableName: 'cliente',
    paranoid: true
  });
  return Cliente;
};