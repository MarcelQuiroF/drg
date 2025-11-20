'use strict';

module.exports = (sequelize, DataTypes) => {
  const ContenedorTransaccion = sequelize.define('ContenedorTransaccion', {
    orden_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 }
    },
    tipo: {
      type: DataTypes.STRING(50),
      allowNull: false
    }
  }, {
    tableName: 'contenedor_transaccion',
    paranoid: true,
    deletedAt: 'deletedAt',
    timestamps: true,
    hooks: {
      beforeCreate: (transaccion) => {
        console.log(`Creando transacción para cliente ${transaccion.cliente_id}`);
      },
      beforeUpdate: (transaccion) => {
        console.log(`Actualizando transacción ID ${transaccion.id}`);
      },
      beforeDestroy: (transaccion) => {
        console.log(`Soft delete de transacción ID ${transaccion.id}`);
      }
    }
  });

  ContenedorTransaccion.associate = (models) => {
    ContenedorTransaccion.belongsTo(models.Orden, { foreignKey: 'orden_id' });
    ContenedorTransaccion.belongsTo(models.Cliente, { foreignKey: 'cliente_id' });
  };

  return ContenedorTransaccion;
};
