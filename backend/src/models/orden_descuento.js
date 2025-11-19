'use strict';
module.exports = (sequelize, DataTypes) => {
  const OrdenDescuento = sequelize.define('OrdenDescuento', {
    orden_id: DataTypes.INTEGER,
    descuento_id: DataTypes.INTEGER
  }, {
    tableName: 'orden_descuento',
    paranoid: true
  });
  return OrdenDescuento;
};
