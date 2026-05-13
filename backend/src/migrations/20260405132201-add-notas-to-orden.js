'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('orden', 'notas', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('orden', 'notas');
  }
};
