'use strict';

module.exports = (sequelize, DataTypes) => {
  const Atraso = sequelize.define('Atraso', {
    empleado_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    descuento_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false
    },
    horario_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'atraso',
    paranoid: true,
    deletedAt: 'deletedAt',
    timestamps: true,
    hooks: {
      beforeCreate: (atraso) => {
        console.log(
          `Se registrará un atraso del empleado ${atraso.empleado_id} el día ${atraso.fecha}`
        );
      },
      beforeDestroy: (atraso) => {
        console.log(
          `Soft delete de atraso ID ${atraso.id} (empleado ${atraso.empleado_id})`
        );
      }
    }
  });

  return Atraso;
};
