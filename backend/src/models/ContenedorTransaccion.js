'use strict';
module.exports = (sequelize, DataTypes) => {
  const ContenedorTransaccion = sequelize.define('ContenedorTransaccion', {
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: "La cantidad no puede ser negativa" }
      }
    },
    tipo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: { notEmpty: true }
    },
    orden_id: { type: DataTypes.INTEGER, allowNull: true },
    cliente_id: { type: DataTypes.INTEGER, allowNull: true }
  }, {
    tableName: 'contenedor_transaccion',
    paranoid: true
  });
  return ContenedorTransaccion;
};