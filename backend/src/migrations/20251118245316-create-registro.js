'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('registro', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      fecha: { type: Sequelize.DATE },
      deletedAt: { type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('registro');
  }
};
