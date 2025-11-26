'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reserva', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      cliente_id: {
        type: Sequelize.INTEGER,
        references: { model: 'cliente', key: 'id' },
        onDelete: 'CASCADE',
        allowNull: false
      },
      hora: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      mesa_id: {
        type: Sequelize.INTEGER,
        references: { model: 'mesa', key: 'id' },
        onDelete: 'CASCADE',
        allowNull: false
      },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('reserva');
  }
};
