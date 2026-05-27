'use strict';
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Horario', {
    dia: DataTypes.STRING,
    hora_entrada: DataTypes.TIME,
    hora_salida: DataTypes.TIME,
    
    empleado_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'horario',
    paranoid: true
  });
};