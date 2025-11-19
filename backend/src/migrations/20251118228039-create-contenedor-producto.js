'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('contenedor_producto', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      producto_id: { 
        type: Sequelize.INTEGER, 
        references: { model: 'producto', key: 'id' }, 
        onDelete: 'CASCADE' 
      },
      cantidad: { type: Sequelize.INTEGER },
      cantidadRecibido: { type: Sequelize.INTEGER },
      cantidadPreparando: { type: Sequelize.INTEGER },
      cantidadTerminado: { type: Sequelize.INTEGER },
      comentario: { type: Sequelize.STRING(255) },
      
      deletedAt: { type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('contenedor_producto');
  }
};
