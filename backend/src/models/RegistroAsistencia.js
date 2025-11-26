'use strict';
module.exports = (sequelize, DataTypes) => {
  const RegistroAsistencia = sequelize.define('RegistroAsistencia', {
    registro_id: {
      type: DataTypes.INTEGER,
      references: { model: 'registro', key: 'id' }
    },
    atraso_id: { 
      type: DataTypes.INTEGER,
      references: { model: 'asistencia', key: 'id' }
    }
  }, {
    tableName: 'registro_asistencia',
    paranoid: true
  });
  return RegistroAsistencia;
};