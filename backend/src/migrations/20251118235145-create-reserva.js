'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reserva', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      cliente_id: {
        type: Sequelize.INTEGER,
        references: { model: 'cliente', key: 'id' },
        onDelete: 'CASCADE'
      },
      hora: { type: Sequelize.DATE },
      mesa_id: {
        type: Sequelize.INTEGER,
        references: { model: 'mesa', key: 'id' },
        onDelete: 'CASCADE'
      },
      deletedAt: { type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('reserva');
  }
};
