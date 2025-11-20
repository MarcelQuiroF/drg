'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('registro_atraso', {
      registro_id: {
        type: Sequelize.INTEGER,
        references: { model: 'registro', key: 'id' },
        onDelete: 'CASCADE',
        primaryKey: true
      },
      atraso_id: {
        type: Sequelize.INTEGER,
        references: { model: 'atraso', key: 'id' },
        onDelete: 'CASCADE',
        primaryKey: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('registro_atraso');
  }
};
