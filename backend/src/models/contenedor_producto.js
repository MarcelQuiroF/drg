'use strict';

module.exports = (sequelize, DataTypes) => {
  const ContenedorProducto = sequelize.define('ContenedorProducto', {
    producto_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 }
    },
    cantidadRecibido: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    cantidadPreparando: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    cantidadTerminado: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    cantidadEnviado: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    comentario: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
    
  }, {
    tableName: 'contenedor_producto',
    paranoid: true,
    deletedAt: 'deletedAt',
    timestamps: true,
    hooks: {
      beforeCreate: (cp) => {
        console.log(`Se va a crear ContenedorProducto para producto ${cp.producto_id}`);
      },
      beforeUpdate: (cp) => {
        console.log(`Se va a actualizar ContenedorProducto ID ${cp.id}`);
      },
      beforeDestroy: (cp) => {
        console.log(`Soft delete de ContenedorProducto ID ${cp.id}`);
      }
    }
  });

  ContenedorProducto.associate = (models) => {
    ContenedorProducto.belongsTo(models.Producto, { foreignKey: 'producto_id' });
  };

  return ContenedorProducto;
};
