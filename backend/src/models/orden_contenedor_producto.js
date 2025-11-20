'use strict';

module.exports = (sequelize, DataTypes) => {
  const OrdenContenedorProducto = sequelize.define('OrdenContenedorProducto', {
    orden_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: 'orden', key: 'id' }
    },
    contenedor_producto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: 'contenedor_producto', key: 'id' }
    }
  }, {
    tableName: 'orden_contenedor_producto',
    paranoid: true,
    deletedAt: 'deletedAt',
    timestamps: true,
    hooks: {
      beforeCreate: (registro) => {
        console.log(`Creando relación orden ${registro.orden_id} - contenedor_producto ${registro.contenedor_producto_id}`);
      },
      beforeDestroy: (registro) => {
        console.log(`Soft delete relación orden ${registro.orden_id} - contenedor_producto ${registro.contenedor_producto_id}`);
      }
    }
  });

  return OrdenContenedorProducto;
};
