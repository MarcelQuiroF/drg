'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('descuento_atraso', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      cantidad_tiempo: { type: Sequelize.DATE },
      descuento: { type: Sequelize.INTEGER },
      descuento_porcentual: { type: Sequelize.INTEGER },
      deletedAt: { type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('descuento_atraso');
  }
};
