'use strict';

module.exports = (sequelize, DataTypes) => {
  const RegistroAtraso = sequelize.define('RegistroAtraso', {
    registro_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: 'registro', key: 'id' }
    },
    atraso_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: 'atraso', key: 'id' }
    }
  }, {
    tableName: 'registro_atraso',
    paranoid: true,
    deletedAt: 'deletedAt',
    timestamps: true,
    hooks: {
      beforeCreate: (registro) => {
        console.log(`Creando relación registro ${registro.registro_id} - atraso ${registro.atraso_id}`);
      },
      beforeDestroy: (registro) => {
        console.log(`Soft delete relación registro ${registro.registro_id} - atraso ${registro.atraso_id}`);
      }
    }
  });

  return RegistroAtraso;
};
