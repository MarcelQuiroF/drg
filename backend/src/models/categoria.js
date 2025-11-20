'use strict';

module.exports = (sequelize, DataTypes) => {
  const Categoria = sequelize.define('Categoria', {
    nombre: { 
      type: DataTypes.STRING(100),
      allowNull: false 
    }
  }, {
    tableName: 'categoria',
    paranoid: true,          // habilita soft delete
    deletedAt: 'deletedAt',  // aseguras el nombre de la columna
    timestamps: true,        // necesario para createdAt/updatedAt
    hooks: {
      beforeCreate: (categoria) => {
        console.log('Creando categoría:', categoria.nombre);
      },
      beforeDestroy: (categoria) => {
        console.log('Soft delete de categoría:', categoria.nombre);
      }
    }
  });

  return Categoria;
};
