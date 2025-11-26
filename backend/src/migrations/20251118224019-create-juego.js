'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('juego', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: Sequelize.STRING(100), allowNull: false },
      precio: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      imagen: { type: Sequelize.STRING(255), allowNull: true },
      jugadores_min: { type: Sequelize.INTEGER, allowNull: false },
      jugadores_max: { type: Sequelize.INTEGER, allowNull: false },
      activado: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      tiempo_partida: { type: Sequelize.INTEGER, allowNull: false }, // Minutos

      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('juego'); }
};