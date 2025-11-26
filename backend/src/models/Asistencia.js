'use strict';
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Asistencia', {
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    aprobado: { type: DataTypes.BOOLEAN, defaultValue: true },
    empleado_id: DataTypes.INTEGER,
    horario_id: DataTypes.INTEGER,
    descuento_id: DataTypes.INTEGER
  }, {
    tableName: 'asistencia',
    paranoid: true
  });
};