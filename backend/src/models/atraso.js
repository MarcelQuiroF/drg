'use strict';
module.exports = (sequelize, DataTypes) => {
  const Atraso = sequelize.define('Atraso', {
    empleado_id: DataTypes.INTEGER,
    descuento_id: DataTypes.INTEGER,
    fecha: DataTypes.DATE,
    horario_id: DataTypes.INTEGER
  }, {
    tableName: 'atraso',
    paranoid: true
  });
  return Atraso;
};
