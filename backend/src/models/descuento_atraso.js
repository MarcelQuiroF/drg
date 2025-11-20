'use strict';

module.exports = (sequelize, DataTypes) => {
  const DescuentoAtraso = sequelize.define('DescuentoAtraso', {
    cantidad_tiempo: {
      type: DataTypes.DATE,
      allowNull: false
    },
    descuento: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 }
    },
    descuento_porcentual: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0, max: 100 }
    }
  }, {
    tableName: 'descuento_atraso',
    paranoid: true,
    deletedAt: 'deletedAt',
    timestamps: true,
    hooks: {
      beforeCreate: (descuento) => {
        console.log(`Se va a crear un descuento para tiempo ${descuento.cantidad_tiempo}`);
      },
      beforeUpdate: (descuento) => {
        console.log(`Se va a actualizar DescuentoAtraso ID ${descuento.id}`);
      },
      beforeDestroy: (descuento) => {
        console.log(`Soft delete de DescuentoAtraso ID ${descuento.id}`);
      }
    }
  });

  return DescuentoAtraso;
};
