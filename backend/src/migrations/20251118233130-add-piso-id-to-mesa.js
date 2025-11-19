'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('mesa', 'piso_id', {
      type: Sequelize.INTEGER,
      references: { model: 'piso', key: 'id' },
      onDelete: 'SET NULL'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('mesa', 'piso_id');
  }
};
