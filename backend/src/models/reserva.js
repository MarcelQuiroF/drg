'use strict';
module.exports = (sequelize, DataTypes) => {
  const Reserva = sequelize.define('Reserva', {
    cliente_id: DataTypes.INTEGER,
    hora: DataTypes.DATE,
    mesa_id: DataTypes.INTEGER
  }, {
    tableName: 'reserva',
    paranoid: true
  });
  return Reserva;
};
