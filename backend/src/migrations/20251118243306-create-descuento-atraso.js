'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('descuento_atraso', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      // CAMBIO: DATE a TIME para representar "00:15:00" (15 mins de atraso)
      cantidad_tiempo: { type: Sequelize.TIME, allowNull: false },
      descuento: { type: Sequelize.INTEGER, allowNull: false }, // ¿Es dinero? Si sí, usar DECIMAL
      descuento_porcentual: { type: Sequelize.INTEGER, allowNull: false },

      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('descuento_atraso'); }
};