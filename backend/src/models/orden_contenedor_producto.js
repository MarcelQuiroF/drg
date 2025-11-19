'use strict';
module.exports = (sequelize, DataTypes) => {
  const OrdenContenedorProducto = sequelize.define('OrdenContenedorProducto', {
    orden_id: DataTypes.INTEGER,
    contenedor_producto_id: DataTypes.INTEGER
  }, {
    tableName: 'orden_contenedor_producto',
    paranoid: true
  });
  return OrdenContenedorProducto;
};
