'use strict';
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Descuento', {
    porcentaje: { type: DataTypes.INTEGER, validate: { min: 0, max: 100 } },
    monto: { type: DataTypes.DECIMAL(10, 2), validate: { min: 0 } },
    comentario: DataTypes.STRING
  }, {
    tableName: 'descuento',
    paranoid: true
  });
};