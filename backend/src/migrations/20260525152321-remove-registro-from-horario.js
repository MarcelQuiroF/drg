'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Eliminar la columna 'registro'
    await queryInterface.removeColumn('horario', 'registro');
  },

  down: async (queryInterface, Sequelize) => {
    // Recrear la columna en caso de rollback
    await queryInterface.addColumn('horario', 'registro', {
      type: Sequelize.DATE
    });
  }
};