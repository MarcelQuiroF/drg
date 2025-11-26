'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('contenedor_producto', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      
      // CAMBIO: Relación directa con Orden (1 Orden tiene N Contenedores)
      orden_id: { 
        type: Sequelize.INTEGER, 
        allowNull: false,
        references: { model: 'orden', key: 'id' },
        onDelete: 'CASCADE' 
      },

      producto_id: { 
        type: Sequelize.INTEGER, 
        allowNull: false,
        references: { model: 'producto', key: 'id' },
        onDelete: 'CASCADE' 
      },
      
      cantidad: { type: Sequelize.INTEGER, allowNull: false },
      
      cantidad_recibido: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      cantidad_preparando: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      cantidad_terminado: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      cantidad_enviado: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      
      comentario: { type: Sequelize.STRING(255), allowNull: true },

      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('contenedor_producto'); }
};