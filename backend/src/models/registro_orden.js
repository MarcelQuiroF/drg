'use strict';

module.exports = (sequelize, DataTypes) => {
  const RegistroOrden = sequelize.define('RegistroOrden', {
    registro_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: 'registro', key: 'id' }
    },
    orden_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: 'orden', key: 'id' }
    }
  }, {
    tableName: 'registro_orden',
    paranoid: true,
    deletedAt: 'deletedAt',
    timestamps: true,
    hooks: {
      beforeCreate: (registro) => {
        console.log(`Creando relación registro ${registro.registro_id} - orden ${registro.orden_id}`);
      },
      beforeDestroy: (registro) => {
        console.log(`Soft delete relación registro ${registro.registro_id} - orden ${registro.orden_id}`);
      }
    }
  });

  return RegistroOrden;
};
