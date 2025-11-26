'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('horario', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      dia: { type: Sequelize.STRING(20), allowNull: false },
      hora_entrada: { type: Sequelize.TIME, allowNull: false },
      hora_salida: { type: Sequelize.TIME, allowNull: false },
      registro: { type: Sequelize.DATE, allowNull: true },

      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('horario');
  }
};
