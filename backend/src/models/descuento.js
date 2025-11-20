'use strict';

module.exports = (sequelize, DataTypes) => {
  const Descuento = sequelize.define('Descuento', {
    porcentaje: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0, max: 100 }
    },
    monto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 }
    },
    comentario: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'descuento',
    paranoid: true,
    deletedAt: 'deletedAt',
    timestamps: true,
    hooks: {
      beforeCreate: (descuento) => {
        console.log(`Creando descuento: porcentaje ${descuento.porcentaje}, monto ${descuento.monto}`);
      },
      beforeUpdate: (descuento) => {
        console.log(`Actualizando descuento ID ${descuento.id}`);
      },
      beforeDestroy: (descuento) => {
        console.log(`Soft delete de descuento ID ${descuento.id}`);
      }
    }
  });

  return Descuento;
};
