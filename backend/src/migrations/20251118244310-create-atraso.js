'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('atraso', {
      id: { 
        type: Sequelize.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
      },

      empleado_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'empleado', key: 'id' },
        onDelete: 'CASCADE'
      },

      descuento_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'descuento_atraso', key: 'id' },
        onDelete: 'CASCADE'
      },

      fecha: { 
        type: Sequelize.DATE,
        allowNull: false
      },

      horario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'horario', key: 'id' },
        onDelete: 'CASCADE'
      },

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
    await queryInterface.dropTable('atraso');
  }
};
