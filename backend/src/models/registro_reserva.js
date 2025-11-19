'use strict';
module.exports = (sequelize, DataTypes) => {
  const RegistroReserva = sequelize.define('RegistroReserva', {
    registro_id: DataTypes.INTEGER,
    reserva_id: DataTypes.INTEGER
  }, {
    tableName: 'registro_reserva',
    paranoid: true
  });
  return RegistroReserva;
};
