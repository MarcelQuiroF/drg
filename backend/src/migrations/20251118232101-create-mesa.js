'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('mesa', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: Sequelize.STRING(100) },
      numero: { type: Sequelize.INTEGER },
      casilla: { type: Sequelize.INTEGER },
      estado: { type: Sequelize.INTEGER },
      deletedAt: { type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('mesa');
  }
};
