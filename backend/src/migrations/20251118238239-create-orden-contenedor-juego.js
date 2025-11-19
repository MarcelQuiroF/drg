'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orden_contenedor_juego', {
      orden_id: {
        type: Sequelize.INTEGER,
        references: { model: 'orden', key: 'id' },
        onDelete: 'CASCADE',
        primaryKey: true
      },
      contenedor_juego_id: {
        type: Sequelize.INTEGER,
        references: { model: 'contenedor_juego', key: 'id' },
        onDelete: 'CASCADE',
        primaryKey: true
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('orden_contenedor_juego');
  }
};
