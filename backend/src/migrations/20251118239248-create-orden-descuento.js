'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orden_descuento', {
      orden_id: {
        type: Sequelize.INTEGER,
        references: { model: 'orden', key: 'id' },
        onDelete: 'CASCADE',
        primaryKey: true
      },
      descuento_id: {
        type: Sequelize.INTEGER,
        references: { model: 'descuento', key: 'id' },
        onDelete: 'CASCADE',
        primaryKey: true
      },
      // CAMBIO: Agregados Timestamps
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('orden_descuento'); }
};