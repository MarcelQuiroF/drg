'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('registro_orden', {
      registro_id: {
        type: Sequelize.INTEGER,
        references: { model: 'registro', key: 'id' },
        onDelete: 'CASCADE',
        primaryKey: true
      },
      orden_id: {
        type: Sequelize.INTEGER,
        references: { model: 'orden', key: 'id' },
        onDelete: 'CASCADE',
        primaryKey: true
      },
      
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('registro_orden');
  }
};
