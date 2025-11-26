'use strict';

module.exports = (sequelize, DataTypes) => {
  const OrdenDescuento = sequelize.define('OrdenDescuento', {
    orden_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: 'orden', key: 'id' }
    },
    descuento_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: 'descuento', key: 'id' }
    }
  }, {
    tableName: 'orden_descuento',
    paranoid: true,
    deletedAt: 'deletedAt',
    timestamps: true,
    hooks: {
      beforeCreate: (registro) => {
        console.log(`Creando relación orden ${registro.orden_id} - descuento ${registro.descuento_id}`);
      },
      beforeDestroy: (registro) => {
        console.log(`Soft delete relación orden ${registro.orden_id} - descuento ${registro.descuento_id}`);
      }
    }
  });

  return OrdenDescuento;
};
