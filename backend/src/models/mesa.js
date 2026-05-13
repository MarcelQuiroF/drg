'use strict';
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Mesa', {
    nombre: DataTypes.STRING,
    numero: DataTypes.INTEGER,
    estado: { type: DataTypes.INTEGER, defaultValue: 0 },
    piso_id: DataTypes.INTEGER,
    cantidadMinima: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: { min: 1 }
    },
    cantidadMaxima: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4,
      validate: { 
        min: 1,
        isGreaterThanMin(value) {
          if (value < this.cantidadMinima) {
            throw new Error("La capacidad máxima no puede ser menor a la mínima.");
          }
        }
      }
    }
  }, {
    tableName: 'mesa',
    paranoid: true
  });
};