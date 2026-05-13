'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('mesa', 'cantidadMinima', {
      type: Sequelize.INTEGER,
      defaultValue: 1,
      allowNull: false
    });

    await queryInterface.addColumn('mesa', 'cantidadMaxima', {
      type: Sequelize.INTEGER,
      defaultValue: 4,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('mesa', 'cantidadMinima');
    await queryInterface.removeColumn('mesa', 'cantidadMaxima');
  }
};