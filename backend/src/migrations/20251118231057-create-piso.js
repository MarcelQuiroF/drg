'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('piso', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: Sequelize.STRING(100) },
      numero: { type: Sequelize.INTEGER },
      activo: { type: Sequelize.BOOLEAN },
      deletedAt: { type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('piso');
  }
};
