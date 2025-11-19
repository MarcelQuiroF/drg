'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orden_contenedor_producto', {
      orden_id: {
        type: Sequelize.INTEGER,
        references: { model: 'orden', key: 'id' },
        onDelete: 'CASCADE',
        primaryKey: true
      },
      contenedor_producto_id: {
        type: Sequelize.INTEGER,
        references: { model: 'contenedor_producto', key: 'id' },
        onDelete: 'CASCADE',
        primaryKey: true
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('orden_contenedor_producto');
  }
};
