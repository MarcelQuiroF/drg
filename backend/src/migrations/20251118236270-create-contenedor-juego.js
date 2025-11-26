'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('contenedor_juego', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      
      // CAMBIO: Agregada referencia a Orden
      orden_id: { 
        type: Sequelize.INTEGER, 
        allowNull: false,
        references: { model: 'orden', key: 'id' },
        onDelete: 'CASCADE' 
      },

      juego_id: { 
        type: Sequelize.INTEGER, 
        allowNull: false,
        references: { model: 'juego', key: 'id' },
        onDelete: 'CASCADE' 
      },
      
      hora_inicio: { type: Sequelize.TIME, allowNull: false },
      hora_fin: { type: Sequelize.TIME, allowNull: false },
      cantidad: { type: Sequelize.INTEGER, allowNull: false },
      comentario: { type: Sequelize.STRING(255), allowNull: true },

      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('contenedor_juego'); }
};