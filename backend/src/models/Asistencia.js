'use strict';
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Asistencia', {
    fecha_hora_llegada: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    
    aprobado: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    estado: { 
      type: DataTypes.STRING, 
      allowNull: false,
      defaultValue: 'PRESENTE',
      validate: {
        isIn: [['PRESENTE', 'FALTA', 'PERMISO']]
      }
    },
    
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