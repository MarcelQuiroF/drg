'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('contenedor_juego', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      juego_id: { 
        type: Sequelize.INTEGER, 
        references: { model: 'juego', key: 'id' }, 
        onDelete: 'CASCADE' 
      },
      hora_inicio: { type: Sequelize.DATE },
      hora_fin: { type: Sequelize.DATE },
      cantidad: { type: Sequelize.INTEGER },
      comentario: { type: Sequelize.STRING(255) },
      deletedAt: { type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('contenedor_juego');
  }
};
