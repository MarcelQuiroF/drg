'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('horario', 'empleado_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'empleado', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('horario', 'empleado_id');
  }
};