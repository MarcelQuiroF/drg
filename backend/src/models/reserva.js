'use strict';

module.exports = (sequelize, DataTypes) => {
  const Reserva = sequelize.define('Reserva', {
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'cliente', key: 'id' }
    },
    hora: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    mesa_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'mesa', key: 'id' }
    }
  }, {
    tableName: 'reserva',
    paranoid: true,
    deletedAt: 'deletedAt',
    timestamps: true,
    hooks: {
      beforeCreate: (reserva) => {
        console.log(`Creando reserva para cliente ${reserva.cliente_id} en mesa ${reserva.mesa_id}`);
      },
      beforeUpdate: (reserva) => {
        console.log(`Actualizando reserva ID ${reserva.id}`);
      },
      beforeDestroy: (reserva) => {
        console.log(`Soft delete reserva ID ${reserva.id}`);
      }
    }
  });

  return Reserva;
};
