'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('contenedor_producto', {
      id: { 
        type: Sequelize.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
      },
      producto_id: { 
        type: Sequelize.INTEGER, 
        allowNull: false,
        references: { model: 'producto', key: 'id' },
        onDelete: 'CASCADE' 
      },
      cantidad: { type: Sequelize.INTEGER, allowNull: false },
      cantidadRecibido: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      cantidadPreparando: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      cantidadTerminado: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      comentario: { type: Sequelize.STRING(255), allowNull: true },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('contenedor_producto');
  }
};
