'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('contenedor_transaccion', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      orden_id: {
        type: Sequelize.INTEGER,
        references: { model: 'orden', key: 'id' },
        onDelete: 'SET NULL'
      },
      cliente_id: {
        type: Sequelize.INTEGER,
        references: { model: 'cliente', key: 'id' },
        onDelete: 'SET NULL'
      },
      fecha: { type: Sequelize.DATE },
      activo: { type: Sequelize.BOOLEAN },
      cantidad: { type: Sequelize.INTEGER },
      tipo: { type: Sequelize.STRING(50) },
      deletedAt: { type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('contenedor_transaccion');
  }
};
