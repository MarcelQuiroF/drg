'use strict';
module.exports = (sequelize, DataTypes) => {
  const RegistroOrden = sequelize.define('RegistroOrden', {
    registro_id: {
      type: DataTypes.INTEGER,
      references: { model: 'registro', key: 'id' }
    },
    orden_id: {
      type: DataTypes.INTEGER,
      references: { model: 'orden', key: 'id' }
    }
  }, {
    tableName: 'registro_orden',
    paranoid: true
  });
  return RegistroOrden;
};