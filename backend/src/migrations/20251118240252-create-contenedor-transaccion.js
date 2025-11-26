'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('contenedor_transaccion', {
      id: { 
        type: Sequelize.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
      },
      orden_id: { 
        type: Sequelize.INTEGER, 
        allowNull: true,
        references: { model: 'orden', key: 'id' },
        onDelete: 'SET NULL'
      },
      cliente_id: { 
        type: Sequelize.INTEGER, 
        allowNull: true,
        references: { model: 'cliente', key: 'id' },
        onDelete: 'SET NULL'
      },
      fecha: { type: Sequelize.DATE, allowNull: false },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      cantidad: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      tipo: { type: Sequelize.STRING(50), allowNull: false },

      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('contenedor_transaccion');
  }
};
