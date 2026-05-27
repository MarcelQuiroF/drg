'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('mesa', 'activo', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('mesa', 'activo');
  }
};