'use strict';
module.exports = (sequelize, DataTypes) => {
  const RegistroOrden = sequelize.define('RegistroOrden', {
    registro_id: DataTypes.INTEGER,
    orden_id: DataTypes.INTEGER
  }, {
    tableName: 'registro_orden',
    paranoid: true
  });
  return RegistroOrden;
};
