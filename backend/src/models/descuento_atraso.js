'use strict';
module.exports = (sequelize, DataTypes) => {
  const DescuentoAtraso = sequelize.define('DescuentoAtraso', {
    cantidad_tiempo: DataTypes.DATE,
    descuento: DataTypes.INTEGER,
    descuento_porcentual: DataTypes.INTEGER
  }, {
    tableName: 'descuento_atraso',
    paranoid: true
  });
  return DescuentoAtraso;
};
