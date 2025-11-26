'use strict';
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Reserva', {
    hora: { 
      type: DataTypes.DATE, 
      allowNull: false,
      validate: {
        isFuture(value) {

          if (value <= new Date()) {
            throw new Error("La reserva debe ser para una fecha y hora futura");
          }
        }
      }
    },
    cliente_id: DataTypes.INTEGER,
    mesa_id: DataTypes.INTEGER
  }, {
    tableName: 'reserva',
    paranoid: true
  });
};