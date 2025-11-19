'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('juego_categoria', {
      juego_id: {
        type: Sequelize.INTEGER,
        references: { model: 'juego', key: 'id' },
        onDelete: 'CASCADE',
        primaryKey: true
      },
      categoria_id: {
        type: Sequelize.INTEGER,
        references: { model: 'categoria', key: 'id' },
        onDelete: 'CASCADE',
        primaryKey: true
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('juego_categoria');
  }
};
