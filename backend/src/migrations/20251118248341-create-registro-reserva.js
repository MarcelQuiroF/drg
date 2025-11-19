'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('registro_reserva', {
      registro_id: {
        type: Sequelize.INTEGER,
        references: { model: 'registro', key: 'id' },
        primaryKey: true,
        onDelete: 'CASCADE'
      },
      reserva_id: {
        type: Sequelize.INTEGER,
        references: { model: 'reserva', key: 'id' },
        primaryKey: true,
        onDelete: 'CASCADE'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('registro_reserva');
  }
};
