'use strict';
module.exports = (sequelize, DataTypes) => {
  const Orden = sequelize.define('Orden', {
    total: DataTypes.DOUBLE,
    mesa_id: DataTypes.INTEGER
  }, {
    tableName: 'orden',
    paranoid: true
  });
  return Orden;
};
