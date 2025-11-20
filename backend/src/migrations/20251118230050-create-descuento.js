'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('descuento', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      porcentaje: { type: Sequelize.INTEGER, allowNull: false },
      monto: { type: Sequelize.INTEGER, allowNull: false },
      comentario: { type: Sequelize.STRING(255), allowNull: true },

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
    await queryInterface.dropTable('descuento');
  }
};
