'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('descuento', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      porcentaje: { type: Sequelize.INTEGER, allowNull: false },
      // CAMBIO: Integer a Decimal (Dinero)
      monto: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      comentario: { type: Sequelize.STRING(255), allowNull: true },

      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('descuento'); }
};