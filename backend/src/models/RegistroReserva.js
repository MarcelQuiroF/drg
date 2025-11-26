'use strict';
module.exports = (sequelize, DataTypes) => {
  const RegistroReserva = sequelize.define('RegistroReserva', {
    registro_id: {
      type: DataTypes.INTEGER,
      references: { model: 'registro', key: 'id' }
    },
    reserva_id: {
      type: DataTypes.INTEGER,
      references: { model: 'reserva', key: 'id' }
    }
  }, {
    tableName: 'registro_reserva',
    paranoid: true
  });
  return RegistroReserva;
};