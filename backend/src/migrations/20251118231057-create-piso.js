'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('piso', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: Sequelize.STRING(100), allowNull: false },
      numero: { type: Sequelize.INTEGER, allowNull: false },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },

      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('piso');
  }
};
