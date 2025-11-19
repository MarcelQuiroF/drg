'use strict';
module.exports = (sequelize, DataTypes) => {
  const ContenedorProducto = sequelize.define('ContenedorProducto', {
    producto_id: DataTypes.INTEGER,
    cantidad: DataTypes.INTEGER,
    cantidadRecibido: DataTypes.INTEGER,
    cantidadPreparando: DataTypes.INTEGER,
    cantidadTerminado: DataTypes.INTEGER,
    comentario: DataTypes.STRING
  }, {
    tableName: 'contenedor_producto',
    paranoid: true
  });
  return ContenedorProducto;
};
