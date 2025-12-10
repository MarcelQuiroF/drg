'use strict';
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Asistencia', {
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    aprobado: { type: DataTypes.BOOLEAN, defaultValue: false },
    empleado_id: DataTypes.INTEGER,
    horario_id: DataTypes.INTEGER,
    
    descuento_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
    
  }, {
    tableName: 'asistencia',
    paranoid: true
  });
};