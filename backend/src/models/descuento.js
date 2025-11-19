'use strict';
module.exports = (sequelize, DataTypes) => {
  const Descuento = sequelize.define('Descuento', {
    porcentaje: DataTypes.INTEGER,
    monto: DataTypes.INTEGER,
    comentario: DataTypes.STRING
  }, {
    tableName: 'descuento',
    paranoid: true
  });
  return Descuento;
};
