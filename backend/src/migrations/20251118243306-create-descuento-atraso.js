'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('descuento_atraso', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      cantidad_tiempo: { type: Sequelize.DATE, allowNull: false },
      descuento: { type: Sequelize.INTEGER, allowNull: false },
      descuento_porcentual: { type: Sequelize.INTEGER, allowNull: false },

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
    await queryInterface.dropTable('descuento_atraso');
  }
};
