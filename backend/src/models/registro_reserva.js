'use strict';

module.exports = (sequelize, DataTypes) => {
  const RegistroReserva = sequelize.define('RegistroReserva', {
    registro_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: 'registro', key: 'id' }
    },
    reserva_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: 'reserva', key: 'id' }
    }
  }, {
    tableName: 'registro_reserva',
    paranoid: true,
    deletedAt: 'deletedAt',
    timestamps: true,
    hooks: {
      beforeCreate: (registro) => {
        console.log(`Creando relación registro ${registro.registro_id} - reserva ${registro.reserva_id}`);
      },
      beforeDestroy: (registro) => {
        console.log(`Soft delete relación registro ${registro.registro_id} - reserva ${registro.reserva_id}`);
      }
    }
  });

  return RegistroReserva;
};
