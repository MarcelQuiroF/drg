'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orden', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      total: { type: Sequelize.DOUBLE },
      mesa_id: {
        type: Sequelize.INTEGER,
        references: { model: 'mesa', key: 'id' },
        onDelete: 'SET NULL'
      },
      deletedAt: { type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('orden');
  }
};
