'use strict';
module.exports = (sequelize, DataTypes) => {
  const RegistroAtraso = sequelize.define('RegistroAtraso', {
    registro_id: DataTypes.INTEGER,
    atraso_id: DataTypes.INTEGER
  }, {
    tableName: 'registro_atraso',
    paranoid: true
  });
  return RegistroAtraso;
};
