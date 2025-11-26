'use strict';
module.exports = (sequelize, DataTypes) => {
  const ContenedorProducto = sequelize.define('ContenedorProducto', {
    cantidad: { type: DataTypes.INTEGER, validate: { min: 1 } },
    
    cantidad_recibido: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
    cantidad_preparando: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
    cantidad_terminado: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
    cantidad_enviado: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
    
    comentario: DataTypes.STRING,
    
    orden_id: { type: DataTypes.INTEGER, allowNull: false },
    producto_id: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    tableName: 'contenedor_producto',
    paranoid: true
  });
  return ContenedorProducto;
};