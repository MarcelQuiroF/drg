'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Renombrar la columna 'fecha' a 'fecha_hora_llegada'
    await queryInterface.renameColumn('asistencia', 'fecha', 'fecha_hora_llegada');

    // 2. Agregar la nueva columna 'estado'
    await queryInterface.addColumn('asistencia', 'estado', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'PRESENTE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revertir los cambios en caso de error o rollback
    await queryInterface.removeColumn('asistencia', 'estado');
    await queryInterface.renameColumn('asistencia', 'fecha_hora_llegada', 'fecha');
  }
};