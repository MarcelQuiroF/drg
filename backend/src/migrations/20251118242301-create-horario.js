'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('horario', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      dia: { type: Sequelize.STRING(20), allowNull: false },
      hora_entrada: { type: Sequelize.DATE, allowNull: false },
      hora_salida: { type: Sequelize.DATE, allowNull: false },
      registro: { type: Sequelize.DATE, allowNull: true },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('horario');
  }
};
