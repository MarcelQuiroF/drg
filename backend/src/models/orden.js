'use strict';
module.exports = (sequelize, DataTypes) => {
  const Orden = sequelize.define('Orden', {
    total: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: { min: 0 }
    },
    finalizado: { type: DataTypes.BOOLEAN, defaultValue: false },
    mesa_id: DataTypes.INTEGER,
    notas: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'orden',
    paranoid: true
  });
  return Orden;
};