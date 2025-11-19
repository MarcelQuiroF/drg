'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('producto', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: Sequelize.STRING(100) },
      zona: { type: Sequelize.STRING(50) },
      precio: { type: Sequelize.DOUBLE },
      estado: { type: Sequelize.BOOLEAN },
      imagen: { type: Sequelize.STRING(255) },
      deletedAt: { type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('producto');
  }
};
