'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('contenedor_juego', {
      id: { 
        type: Sequelize.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
      },
      juego_id: { 
        type: Sequelize.INTEGER, 
        allowNull: false,
        references: { model: 'juego', key: 'id' },
        onDelete: 'CASCADE' 
      },
      hora_inicio: { type: Sequelize.DATE, allowNull: false },
      hora_fin: { type: Sequelize.DATE, allowNull: false },
      cantidad: { type: Sequelize.INTEGER, allowNull: false },
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
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('contenedor_juego');
  }
};
