'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('juego', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: Sequelize.STRING(100) },
      precio: { type: Sequelize.DOUBLE },
      imagen: { type: Sequelize.STRING(255) },
      jugadores_min: { type: Sequelize.INTEGER },
      jugadores_max: { type: Sequelize.INTEGER },
      tiempo_partida: { type: Sequelize.INTEGER },
      deletedAt: { type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('juego');
  }
};
