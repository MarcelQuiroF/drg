'use strict';

module.exports = (sequelize, DataTypes) => {
  const Orden = sequelize.define('Orden', {
    total: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    mesa_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'mesa', key: 'id' }
    }
  }, {
    tableName: 'orden',
    paranoid: true,
    deletedAt: 'deletedAt',
    timestamps: true,
    hooks: {
      beforeCreate: (orden) => {
        console.log(`Creando orden para la mesa ID ${orden.mesa_id}`);
      },
      beforeUpdate: (orden) => {
        console.log(`Actualizando orden ID ${orden.id}`);
      },
      beforeDestroy: (orden) => {
        console.log(`Soft delete de orden ID ${orden.id}`);
      }
    }
  });

  return Orden;
};
