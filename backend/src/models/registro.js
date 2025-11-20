'use strict';

module.exports = (sequelize, DataTypes) => {
  const Registro = sequelize.define('Registro', {
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'registro',
    paranoid: true,
    deletedAt: 'deletedAt',
    timestamps: true,
    hooks: {
      beforeCreate: (registro) => {
        console.log(`Creando registro con fecha: ${registro.fecha}`);
      },
      beforeUpdate: (registro) => {
        console.log(`Actualizando registro ID ${registro.id}`);
      },
      beforeDestroy: (registro) => {
        console.log(`Soft delete registro ID ${registro.id}`);
      }
    }
  });

  return Registro;
};
