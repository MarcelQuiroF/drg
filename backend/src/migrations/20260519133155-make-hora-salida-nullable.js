'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('horario', 'hora_salida', {
      type: Sequelize.TIME,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('horario', 'hora_salida', {
      type: Sequelize.TIME,
      allowNull: false
    });
  }
};