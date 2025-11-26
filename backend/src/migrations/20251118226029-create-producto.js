'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('producto', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: Sequelize.STRING(100), allowNull: false },
      zona: { type: Sequelize.STRING(50), allowNull: false },
      activado: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }, // Catálogo
      precio: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      estado: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }, // Stock
      imagen: { type: Sequelize.STRING(255), allowNull: true },

      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('producto'); }
};