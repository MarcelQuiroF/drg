'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orden', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      total: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      finalizado: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      mesa_id: {
        type: Sequelize.INTEGER,
        references: { model: 'mesa', key: 'id' },
        onDelete: 'SET NULL',
        allowNull: true
      },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('orden'); }
};