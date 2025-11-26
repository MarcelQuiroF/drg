'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('registro', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      fecha: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },

      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('registro');
  }
};
