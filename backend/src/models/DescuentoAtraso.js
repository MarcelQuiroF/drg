'use strict';
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('DescuentoAtraso', {
    cantidad_tiempo: DataTypes.TIME,
    descuento: { type: DataTypes.INTEGER, validate: { min: 0 } },
    descuento_porcentual: { type: DataTypes.INTEGER, validate: { min: 0, max: 100 } }
  }, {
    tableName: 'descuento_atraso',
    paranoid: true
  });
};