'use strict';
module.exports = (sequelize, DataTypes) => {
  const ProductoCategoria = sequelize.define('ProductoCategoria', {
    producto_id: {
      type: DataTypes.INTEGER,
      references: { model: 'producto', key: 'id' }
    },
    categoria_id: {
      type: DataTypes.INTEGER,
      references: { model: 'categoria', key: 'id' }
    }
  }, {
    tableName: 'producto_categoria',
    paranoid: true,
    timestamps: true
  });
  return ProductoCategoria;
};